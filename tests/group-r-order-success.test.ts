import { test, expect } from './helpers/fixtures'
import { loginAsAdmin } from './helpers/auth'

test.describe('Group R: Order Success and Account', () => {
  test('R1: Order success page for guest order', async ({ page, env }) => {
    await page.goto('/checkout')
    await page.waitForTimeout(2000)
    const fullName = page.locator('#fullName')
    if (await fullName.count() > 0) {
      await fullName.fill('Guest User')
      await page.locator('#phone').fill('0244123456')
      await page.locator('#email').fill('guest@example.com')
      await page.locator('#address').fill('123 Guest Street')
      await page.locator('#city').fill('Accra')
      const deliverySelect = page.locator('#deliveryLocation')
      if (await deliverySelect.count() > 0) {
        const options = await deliverySelect.locator('option').count()
        if (options > 1) {
          await deliverySelect.selectOption({ index: 1 })
        }
      }
      const placeOrderBtn = page.getByRole('button', { name: /Place Order/ })
      if (await placeOrderBtn.count() > 0) {
        await placeOrderBtn.click()
        await page.waitForTimeout(5000)
        await expect(page.url()).toMatch(/order-success/)
      }
    }
  })

  test('R2: Account page accessible', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/account')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText('Account')
  })

  test('R3: Account profile page accessible', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/account/profile')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText('Profile')
  })

  test('R4: Account orders page accessible', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/account/orders')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText(/orders/i)
  })
})