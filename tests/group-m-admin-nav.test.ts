import { test, expect } from './helpers/fixtures'
import { loginAsAdmin, logout } from './helpers/auth'

test.describe('Group M: Admin Navigation Workflow', () => {
  test('M1: Dashboard accessible', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('M2: Products page accessible', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/products')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText('Products')
  })

  test('M3: Categories page accessible', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/categories')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText('Categories')
  })

  test('M4: Orders page accessible', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/orders')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText('Orders')
  })

  test('M5: Customers page accessible', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/customers')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText('Customers')
  })

  test('M6: Contact messages page accessible', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/contact')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText('Contact Messages')
  })

  test('M7: Service requests page accessible', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/service-requests')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText('Service Requests')
  })

  test('M8: Newsletter page accessible', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/newsletter')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText('Newsletter')
  })

  test('M9: Branding page accessible', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/branding')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText('Branding')
  })

  test('M10: Delivery page accessible', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/delivery')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText('Delivery Locations')
  })

  test('M11: Inventory page accessible', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/inventory')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText('Inventory')
  })

  test('M12: Hero page accessible', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/hero')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1').first()).toContainText('Homepage Hero')
  })

  test('M13: Admin logout works', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await logout(page)
    await expect(page).toHaveURL(/.*admin\/login/)
  })
})