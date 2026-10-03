import { test, expect } from './helpers/fixtures'
import { loginAsAdmin } from './helpers/auth'

test.describe('Group D: Newsletter Workflow', () => {
  test.describe.configure({ mode: 'serial' })

  let testEmail: string

  test.beforeAll(async () => {
    testEmail = `e2e-newsletter-${Date.now()}@example.com`
  })

  test('D1: Subscribe via admin newsletter page', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/newsletter')
    await page.waitForTimeout(3000)

    await page.waitForSelector('input[type="email"]', { state: 'visible' })
    await page.locator('input[type="email"]').fill(testEmail)

    const subscribeBtn = page.getByRole('button', { name: /Subscribe/i }).first()
    await expect(subscribeBtn).toBeVisible()
    await subscribeBtn.click()

    await expect(page.getByText('Subscription successful!')).toBeVisible({ timeout: 15000 })
  })

  test('D2: Duplicate subscription returns error', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/newsletter')
    await page.waitForTimeout(3000)

    await page.waitForSelector('input[type="email"]', { state: 'visible' })
    await page.locator('input[type="email"]').fill(testEmail)

    const subscribeBtn = page.getByRole('button', { name: /Subscribe/i }).first()
    await expect(subscribeBtn).toBeVisible()
    await subscribeBtn.click()

    await expect(page.getByText('This email is already subscribed.')).toBeVisible({
      timeout: 15000,
    })
  })

  test('D3: Invalid email shows validation error', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/newsletter')
    await page.waitForTimeout(3000)

    await page.waitForSelector('input[type="email"]', { state: 'visible' })
    await page.locator('input[type="email"]').fill('invalid-email')

    const subscribeBtn = page.getByRole('button', { name: /Subscribe/i }).first()
    await expect(subscribeBtn).toBeVisible()
    await subscribeBtn.click()

    await expect(page.getByText(/Please enter a valid email address/)).toBeVisible({
      timeout: 15000,
    })
  })

  test('D4: View subscribers list', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/newsletter')
    await page.waitForTimeout(3000)

    await page.waitForSelector('input[type="email"]', { state: 'visible' })

    const subscribersBtn = page.getByRole('button', { name: /subscriber/i }).first()
    await expect(subscribersBtn).toBeVisible()
    await subscribersBtn.click()

    await expect(page.locator('table')).toBeVisible({ timeout: 10000 })
  })

  test('D5: Newsletter subscribe API returns success', async ({ page, env }) => {
    const uniqueEmail = `api-test-${Date.now()}@example.com`
    const response = await page.request.post('/api/newsletter/subscribe', {
      data: { email: uniqueEmail },
    })
    expect(response.ok()).toBe(true)
    const body = await response.json()
    expect(body.success).toBe(true)

    await loginAsAdmin(page, env)
    const getResponse = await page.request.get('/api/newsletter/subscribers')
    expect(getResponse.ok()).toBe(true)
    const getBody = await getResponse.json()
    const subscribers = getBody.subscribers || []
    const found = subscribers.find((s: { email: string }) => s.email === uniqueEmail)
    expect(found).toBeTruthy()
  })

  test('D6: Homepage newsletter form subscribes successfully', async ({ page }) => {
    const uniqueEmail = `homepage-${Date.now()}@example.com`

    await page.goto('/')
    await page.waitForTimeout(2000)

    const acceptBtn = page.getByRole('button', { name: /Accept All/i })
    if (await acceptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await acceptBtn.click()
      await page.waitForTimeout(1000)
    }

    await page.waitForSelector('#newsletter-email', { state: 'visible', timeout: 10000 })
    await page.locator('#newsletter-email').fill(uniqueEmail)

    const subscribeBtn = page.getByRole('button', { name: /Subscribe/i }).first()
    await expect(subscribeBtn).toBeVisible()
    await subscribeBtn.click()

    await expect(page.getByText(/Thank you for subscribing/)).toBeVisible({
      timeout: 15000,
    })
  })

  test('D7: Homepage newsletter form shows error for duplicate email', async ({ page }) => {
    const dupEmail = `dup-home-${Date.now()}@example.com`

    const response = await page.request.post('/api/newsletter/subscribe', {
      data: { email: dupEmail },
    })
    expect(response.ok()).toBe(true)
    const body = await response.json()
    expect(body.success).toBe(true)

    await page.goto('/')
    await page.waitForTimeout(2000)

    const acceptBtn = page.getByRole('button', { name: /Accept All/i })
    if (await acceptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await acceptBtn.click()
      await page.waitForTimeout(1000)
    }

    await page.waitForSelector('#newsletter-email', { state: 'visible', timeout: 10000 })
    await page.locator('#newsletter-email').fill(dupEmail)
    const subscribeBtn = page.getByRole('button', { name: /Subscribe/i }).first()
    await subscribeBtn.click()

    await page.waitForTimeout(5000)
    const errorMsg = page.locator('.bg-red-50')
    await expect(errorMsg).toBeVisible({ timeout: 15000 })
    const text = await errorMsg.textContent()
    expect(text).toMatch(/already subscribed|Failed/i)
  })
})
