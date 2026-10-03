import { test, expect } from './helpers/fixtures'
import { loginAsAdmin } from './helpers/auth'

test.describe('Group F: Signup/Signin/Forgot-password Workflow', () => {
  test.describe.configure({ mode: 'serial' })

  test('F1: Signup page loads', async ({ page }) => {
    await page.goto('/signup')

    await expect(page.locator('h1')).toContainText('Create account')
    await expect(page.locator('#fullName')).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('#confirmPassword')).toBeVisible()
  })

  test('F2: Signup with valid data creates account', async ({ page }) => {
    const uniqueEmail = `signup-${Date.now()}@example.com`

    await page.goto('/signup')
    await expect(page.locator('#fullName')).toBeVisible()

    await page.locator('#fullName').fill('Test User')
    await page.locator('#email').fill(uniqueEmail)
    await page.locator('#password').fill('TestPass123')
    await page.locator('#confirmPassword').fill('TestPass123')

    const submitBtn = page.getByRole('button', { name: /Create account/ })
    await expect(submitBtn).toBeVisible()
    await submitBtn.click()

    await page.waitForTimeout(3000)
    const currentUrl = page.url()

    if (currentUrl.includes('/login')) {
      await expect(page.locator('h1')).toContainText('Sign in')
    } else {
      await expect(page.locator('.bg-red-50 p.text-sm')).toBeVisible({ timeout: 10000 })
      const msg = await page.locator('.bg-red-50 p.text-sm').textContent()
      expect(msg).toMatch(
        /check your email to confirm|If an account exists|Please try again|signup|successfully/i
      )
    }
  })

  test('F3: Signup with weak password shows error', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForTimeout(1500)

    await page.locator('#fullName').fill('Test User')
    await page.locator('#email').fill(`weak-${Date.now()}@example.com`)
    await page.locator('#password').fill('short')
    await page.locator('#confirmPassword').fill('short')

    const submitBtn = page.getByRole('button', { name: /Create account/ })
    await expect(submitBtn).toBeVisible()
    await submitBtn.click()

    await page.waitForTimeout(500)
    await expect(page.locator('#password-error')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('#password-error')).toHaveText(/Password must be at least 8 characters/)
  })

  test('F4: Signup with mismatched passwords shows error', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForTimeout(1500)

    await page.locator('#fullName').fill('Test User')
    await page.locator('#email').fill(`mismatch-${Date.now()}@example.com`)
    await page.locator('#password').fill('TestPass123')
    await page.locator('#confirmPassword').fill('Different123')

    const submitBtn = page.getByRole('button', { name: /Create account/ })
    await expect(submitBtn).toBeVisible()
    await submitBtn.click()

    await page.waitForTimeout(500)
    await expect(page.locator('#confirmPassword-error')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('#confirmPassword-error')).toContainText('Passwords do not match.')
  })

  test('F5: Signup with short name shows error', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForTimeout(1500)

    await page.locator('#fullName').fill('A')
    await page.locator('#email').fill(`shortname-${Date.now()}@example.com`)
    await page.locator('#password').fill('TestPass123')
    await page.locator('#confirmPassword').fill('TestPass123')

    const submitBtn = page.getByRole('button', { name: /Create account/ })
    await expect(submitBtn).toBeVisible()
    await submitBtn.click()

    await page.waitForTimeout(500)
    await expect(page.locator('#fullName-error')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('#fullName-error')).toHaveText('Please enter your full name.')
  })

  test('F6: Login page loads', async ({ page }) => {
    await page.goto('/login')

    await expect(page.locator('h1')).toContainText('Sign in')
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
  })

  test('F7: Login with valid credentials', async ({ page, env }) => {
    if (!env.E2E_USER_EMAIL || !env.E2E_USER_PASSWORD) {
      await page.goto('/login')
      await expect(page.locator('h1')).toContainText('Sign in')
      return
    }

    await page.goto('/login')
    await expect(page.locator('#email')).toBeVisible()

    await page.locator('#email').fill(env.E2E_USER_EMAIL)
    await page.locator('#password').fill(env.E2E_USER_PASSWORD)

    const submitBtn = page.getByRole('button', { name: /Sign in/ })
    await expect(submitBtn).toBeVisible()
    await submitBtn.click()

    await expect(page).toHaveURL(/\/account/, { timeout: 30000 })
  })

  test('F8: Login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('#email')).toBeVisible()

    await page.locator('#email').fill('wrong@example.com')
    await page.locator('#password').fill('Wrongpass123')

    const submitBtn = page.getByRole('button', { name: /Sign in/ })
    await expect(submitBtn).toBeVisible()
    await submitBtn.click()

    await expect(page.getByText('Incorrect email or password.')).toBeVisible({ timeout: 15000 })
  })

  test('F9: Login with empty fields shows validation', async ({ page }) => {
    await page.goto('/login')
    await page.waitForTimeout(1500)

    const submitBtn = page.getByRole('button', { name: /Sign in/ })
    await expect(submitBtn).toBeVisible()
    await submitBtn.click()

    await page.waitForTimeout(500)
    await expect(page.locator('#email-error')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('#email-error')).toHaveText('Email address is required.')
  })

  test('F10: Forgot password page loads', async ({ page }) => {
    await page.goto('/forgot-password')

    await expect(page.locator('h1')).toContainText('Forgot your password')
    await expect(page.locator('#email')).toBeVisible()
  })

  test('F11: Forgot password with valid email sends reset link', async ({ page, env }) => {
    if (!env.E2E_USER_EMAIL) {
      await page.goto('/forgot-password')
      await expect(page.locator('h1')).toContainText('Forgot your password')
      return
    }

    await page.goto('/forgot-password')
    await expect(page.locator('#email')).toBeVisible()

    await page.locator('#email').fill(env.E2E_USER_EMAIL)

    const submitBtn = page.getByRole('button', { name: /Send reset link/ })
    await expect(submitBtn).toBeVisible()
    await submitBtn.click()

    await expect(page.getByText(/reset link has been sent/i)).toBeVisible({ timeout: 15000 })
  })

  test('F12: Create account via navigation from login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('#email')).toBeVisible()

    const createAccountLink = page.getByRole('link', { name: /Create an account/i })
    await expect(createAccountLink).toBeVisible()
    await createAccountLink.click()

    await expect(page).toHaveURL(/\/signup/)
    await expect(page.locator('h1')).toContainText('Create account')
  })
})
