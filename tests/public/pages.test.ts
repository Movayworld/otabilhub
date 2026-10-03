import { test, expect } from '../helpers/fixtures'
import { loginAsAdmin } from '../helpers/auth'

test.describe('Public Pages', () => {
  test('Homepage loads', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('Shop page loads', async ({ page }) => {
    await page.goto('/shop')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText('Shop')
  })

  test('Services page loads', async ({ page }) => {
    await page.goto('/services')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('About page loads', async ({ page }) => {
    await page.goto('/about')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('Contact page loads', async ({ page }) => {
    await page.goto('/contact')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText('Contact')
  })

  test('Privacy page loads', async ({ page }) => {
    await page.goto('/privacy')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('Terms page loads', async ({ page }) => {
    await page.goto('/terms')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('Login page loads', async ({ page }) => {
    await page.goto('/login')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText('Sign in')
  })

  test('Signup page loads', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText('Create account')
  })

  test('Forgot password page loads', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText('Forgot your password')
  })

  test('Cart page loads', async ({ page }) => {
    await page.goto('/cart')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText(/cart/i)
  })

  test('Checkout page loads', async ({ page }) => {
    await page.goto('/checkout')
    await page.waitForTimeout(2000)
    const h1 = page.locator('h1')
    const h1Text = await h1.textContent()
    expect(h1Text?.includes('Checkout') || h1Text?.includes('Your cart is empty')).toBeTruthy()
  })

  test('Account page loads when authenticated', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/account')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText('Account')
  })
})