import { test, expect } from './helpers/fixtures'
import { loginAsAdmin } from './helpers/auth'

test.describe('Group N: Authorization Workflow', () => {
  test('N1: Unauthenticated user redirected from admin', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)
    await expect(page).toHaveURL(/.*admin\/login/)
  })

  test('N2: Unauthenticated user redirected from admin products', async ({ page }) => {
    await page.goto('/admin/products')
    await page.waitForTimeout(2000)
    await expect(page).toHaveURL(/.*admin\/login/)
  })

  test('N3: Unauthenticated user redirected from admin orders', async ({ page }) => {
    await page.goto('/admin/orders')
    await page.waitForTimeout(2000)
    await expect(page).toHaveURL(/.*admin\/login/)
  })

  test('N4: Unauthenticated user redirected from admin customers', async ({ page }) => {
    await page.goto('/admin/customers')
    await page.waitForTimeout(2000)
    await expect(page).toHaveURL(/.*admin\/login/)
  })

  test('N5: Unauthenticated user redirected from admin contact', async ({ page }) => {
    await page.goto('/admin/contact')
    await page.waitForTimeout(2000)
    await expect(page).toHaveURL(/.*admin\/login/)
  })

  test('N6: Login page accessible when not authenticated', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForTimeout(1500)
    await expect(page.locator('h1')).toContainText('Admin Login')
  })

  test('N7: Admin login page redirects when authenticated', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/login')
    await page.waitForTimeout(2000)
    await expect(page).toHaveURL(/.*admin/)
  })

  test('N8: Admin API requires authentication', async ({ page }) => {
    const response = await page.request.get('/api/admin/customers')
    expect(response.status()).toBe(401)
  })

  test('N9: Newsletter subscribers API requires admin auth', async ({ page }) => {
    const response = await page.request.get('/api/newsletter/subscribers')
    expect(response.status()).toBe(401)
  })

  test('N10: Contact messages API requires admin auth', async ({ page }) => {
    const response = await page.request.get('/api/admin/contact-messages')
    expect(response.status()).toBe(401)
  })
})