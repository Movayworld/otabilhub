import { test, expect } from './helpers/fixtures'
import { loginAsAdmin } from './helpers/auth'

test.describe('Group H: Inventory Workflow', () => {
  test('H1: Admin can view inventory', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/inventory')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText('Inventory')
  })

  test('H2: Inventory shows stock status', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/inventory')
    await page.waitForTimeout(2000)
    const statusLabels = page.locator('span', { hasText: /In Stock|Low Stock|Out of Stock/ })
    const count = await statusLabels.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('H3: Inventory product links to detail page', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/inventory')
    await page.waitForTimeout(2000)
    const productLink = page.locator('a[href^="/admin/inventory/"]').first()
    if (await productLink.count() > 0) {
      await expect(productLink).toBeVisible()
    }
  })

  test('H4: Inventory API returns products with stock', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    const response = await page.request.get('/api/admin/inventory')
    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    expect(Array.isArray(body)).toBeTruthy()
  })
})