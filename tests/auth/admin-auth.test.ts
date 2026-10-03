import { test, expect } from '../helpers/fixtures'
import { loginAsAdmin, logout } from '../helpers/auth'

test.describe('Admin authentication', () => {
  test('admin login page loads', async ({ page, env }) => {
    await page.goto('/admin/login')
    await expect(page).toHaveURL(/.*admin\/login/)
  })

  test('admin login with valid credentials', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await expect(page).toHaveURL(/.*admin/)
  })

  test('admin dashboard loads', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await expect(page).toHaveURL(/.*admin/)
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('unauthenticated user cannot access admin', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/.*admin\/login/)
  })

  test('admin logout works', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await logout(page)
    await expect(page).toHaveURL(/.*admin\/login/)
  })
})