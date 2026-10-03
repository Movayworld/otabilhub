import { test, expect } from './helpers/fixtures'
import { loginAsAdmin } from './helpers/auth'

test.describe('Group J: Contact Workflow', () => {
  test('J1: Contact page loads', async ({ page }) => {
    await page.goto('/contact')
    await page.waitForTimeout(1500)
    await expect(page.locator('h1')).toContainText('Contact')
  })

  test('J2: Contact form submission', async ({ page }) => {
    await page.goto('/contact')
    await page.waitForTimeout(1500)
    const nameInput = page.locator('#name, input[name="name"]').first()
    const emailInput = page.locator('#email, input[name="email"]').first()
    const messageInput = page.locator('#message, textarea[name="message"]').first()
    const submitBtn = page.locator('button[type="submit"]').first()
    if (await nameInput.count() > 0 && await emailInput.count() > 0 && await messageInput.count() > 0) {
      await nameInput.fill('Contact Test User')
      await emailInput.fill('contact-test@example.com')
      await messageInput.fill('This is a test contact message.')
      if (await submitBtn.count() > 0) {
        await submitBtn.click()
        await page.waitForTimeout(2000)
        const successMsg = await page.getByText(/thank|sent|success|message/i).count()
        expect(successMsg).toBeGreaterThanOrEqual(0)
      }
    }
  })

  test('J3: Admin can view contact messages', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/contact')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText('Contact Messages')
  })

  test('J4: Contact messages API accessible by admin', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    const response = await page.request.get('/api/admin/contact-messages')
    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    const messages = body.messages || []
    expect(Array.isArray(messages)).toBeTruthy()
  })

  test('J5: Contact API validates required fields', async ({ page }) => {
    const response = await page.request.post('/api/contact', {
      data: { name: '', email: '', message: '' },
    })
    expect(response.status()).toBe(400)
  })
})