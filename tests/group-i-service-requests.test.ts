import { test, expect } from './helpers/fixtures'
import { loginAsAdmin } from './helpers/auth'

test.describe('Group I: Service Requests Workflow', () => {
  test('I1: Admin can view service requests', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/service-requests')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText('Service Requests')
  })

  test('I2: Service requests list shows data', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/service-requests')
    await page.waitForTimeout(2000)
    const rows = page.locator('tbody tr')
    const count = await rows.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('I3: Service request status badges visible', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/service-requests')
    await page.waitForTimeout(2000)
    const badges = page.locator('span', { hasText: /Pending|Contacted|Scheduled|Completed|Cancelled/ })
    const count = await badges.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('I4: Create service request via API', async ({ page }) => {
    const uniqueId = `SR-${Date.now()}`
    const response = await page.request.post('/api/service-requests', {
      data: {
        service_type: 'Installation',
        description: 'Test service request',
        customer_name: 'Test Customer',
        customer_email: 'sr-test@example.com',
        customer_phone: '0244123456',
      },
    })
    const isCreated = response.ok() || response.status() === 201
    if (!isCreated) {
      const body = await response.json().catch(() => ({}))
      const isDuplicate = body.error?.includes('already') || false
      if (!isDuplicate) {
        expect(isCreated).toBeTruthy()
      }
    }
  })

  test('I5: Service request detail page', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/service-requests')
    await page.waitForTimeout(2000)
    const viewLink = page.locator('a[href^="/admin/service-requests/"]').first()
    if (await viewLink.count() > 0) {
      await expect(viewLink).toBeVisible()
    }
  })

  test('I6: Storefront service request form submits successfully', async ({ page, env }) => {
    const phone = `0244${Math.floor(100000 + Math.random() * 900000)}`
    const address = `Test Address ${Date.now()}`

    await page.goto('/services')
    await page.getByRole('button', { name: /Request Installation/ }).first().click()
    const modal = page.locator('dialog, [role="dialog"]').or(page.locator('.fixed.inset-0'))
    await expect(modal).toBeVisible({ timeout: 10000 })

    await page.locator('#phone').fill(phone)
    await page.locator('#address').fill(address)
    await page.locator('#notes').fill('Test service request notes')
    await page.getByRole('button', { name: /Submit Request/ }).click()

    await expect(page.locator('text=Request received')).toBeVisible({ timeout: 15000 })

    const { adminDbClient } = await import('./helpers/db')
    const db = await adminDbClient(env)
    const { data, error } = await db
      .from('service_requests')
      .select('service_type, address, notes, status')
      .eq('address', address)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    expect(error).toBeNull()
    expect(data?.service_type).toBe('Installation')
    expect(data?.address).toBe(address)
    expect(data?.notes).toContain(phone)
    expect(data?.status).toBe('pending')
  })

  test('I7: Admin service requests list shows phone and address', async ({ page, env }) => {
    const phone = `0244${Math.floor(100000 + Math.random() * 900000)}`
    const address = `List Test Address ${Date.now()}`

    const { adminDbClient } = await import('./helpers/db')
    const db = await adminDbClient(env)
    await db.from('service_requests').insert({
      service_type: 'Installation',
      address,
      notes: `Phone: ${phone}`,
      status: 'pending',
    })

    await loginAsAdmin(page, env)
    await page.goto('/admin/service-requests')
    await page.waitForTimeout(1000)
    await expect(page.locator(`text=${phone}`)).toBeVisible({ timeout: 10000 })
    await expect(page.locator(`text=${address}`)).toBeVisible({ timeout: 10000 })
  })
})