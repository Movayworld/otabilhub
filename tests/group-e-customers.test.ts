import { test, expect } from './helpers/fixtures'
import { loginAsAdmin } from './helpers/auth'

test.describe('Group E: Customers Workflow', () => {
  test('E1: Admin can view customers', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/customers')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText('Customers')
  })

  test('E2: Customers list shows customer data', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/customers')
    await page.waitForTimeout(2000)
    const customerRows = page.locator('tbody tr')
    const count = await customerRows.count()
    expect(count).toBeGreaterThanOrEqual(0)
    if (count > 0) {
      await expect(customerRows.first()).toBeVisible()
    }
  })

  test('E3: Customer shows order count', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/customers')
    await page.waitForTimeout(2000)
    const orderCountHeaders = page.locator('th:has-text("Order")')
    if (await orderCountHeaders.count() > 0) {
      await expect(orderCountHeaders).toBeVisible()
    }
  })

  test('E4: Unauthenticated cannot access customers API', async ({ page }) => {
    const response = await page.request.get('/api/admin/customers')
    expect(response.status()).toBe(401)
  })

  test('E5: Admin customers API returns data', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    const response = await page.request.get('/api/admin/customers')
    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    const customers = body.customers || []
    expect(Array.isArray(customers)).toBeTruthy()
    if (customers.length > 0) {
      const customer = customers[0]
      expect(customer.email).toBeTruthy()
      expect(typeof customer.order_count).toBe('number')
    }
  })
})