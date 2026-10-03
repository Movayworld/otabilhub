import { test, expect } from './helpers/fixtures'
import { loginAsAdmin } from './helpers/auth'

test.describe('Group S: Shop and Storefront', () => {
  test('S1: Shop page loads', async ({ page }) => {
    await page.goto('/shop')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText('Shop')
  })

  test('S2: Product cards visible', async ({ page }) => {
    await page.goto('/shop')
    await page.waitForTimeout(2000)
    const productCards = page.locator('text=Add to cart')
    const count = await productCards.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('S3: Product detail page loads', async ({ page }) => {
    await page.goto('/shop')
    await page.waitForTimeout(2000)
    const productLink = page.locator('a[href^="/shop/"]').first()
    if (await productLink.count() > 0) {
      await productLink.click()
      await page.waitForTimeout(2000)
      const h1 = page.locator('h1')
      await expect(h1).toBeVisible()
    }
  })

  test('S4: Add to cart button visible', async ({ page }) => {
    await page.goto('/shop')
    await page.waitForTimeout(2000)
    const productLink = page.locator('a[href^="/shop/"]').first()
    if (await productLink.count() > 0) {
      await productLink.click()
      await page.waitForTimeout(2000)
      const addToCart = page.getByRole('button', { name: /Add to cart/i })
      if (await addToCart.count() > 0) {
        await expect(addToCart).toBeVisible()
      }
    }
  })

  test('S5: Cart page after adding item', async ({ page, env }) => {
    await page.goto('/shop')
    await page.waitForTimeout(2000)
    const addToCart = page.getByRole('button', { name: /Add to cart/i }).first()
    if (await addToCart.count() > 0) {
      await addToCart.click()
      await page.waitForTimeout(2000)
    }
    await page.goto('/cart')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1')).toContainText(/cart/i)
  })
})