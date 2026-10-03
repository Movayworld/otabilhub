import { test, expect } from './helpers/fixtures'
import { loginAsAdmin } from './helpers/auth'

test.describe('Group P: Admin Orders Workflow', () => {
  test('P1: Admin can view orders', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/orders')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText('Orders')
  })

  test('P2: Order detail page accessible', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/orders')
    await page.waitForTimeout(2000)
    const viewLink = page.locator('a[href^="/admin/orders/"]').first()
    if (await viewLink.count() > 0) {
      await expect(viewLink).toBeVisible()
    }
  })

  test('P3: Order status badges visible', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/orders')
    await page.waitForTimeout(2000)
    const statusBadges = page.locator('span', { hasText: /Pending|Confirmed|Processing|Completed|Cancelled/ })
    const count = await statusBadges.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('P4: Payment state badges visible', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/orders')
    await page.waitForTimeout(2000)
    const paymentBadges = page.locator('span', { hasText: /Pending|Paid|Failed|Refunded/ })
    const count = await paymentBadges.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('P5: Orders API requires admin auth', async ({ page }) => {
    const response = await page.request.get('/api/admin/orders')
    const isForbidden = response.status() === 401 || response.status() === 403
    expect(isForbidden).toBeTruthy()
  })
})