import { test, expect } from './helpers/fixtures'
import { loginAsAdmin } from './helpers/auth'

test.describe('Group T: Cart and Checkout Workflow', () => {
  test.describe.configure({ mode: 'serial' })

  test('T1: Cart page loads', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/cart')

    await expect(page).toHaveURL(/\/cart/)
    await expect(page.locator('h1')).toContainText(/cart/i)
  })

  test('T2: Add product to cart via UI', async ({ page }) => {
    await page.goto('/shop')
    await page.waitForTimeout(2000)

    const productLinks = page.locator('a[href^="/shop/"][href*="-"]')
    await expect(productLinks.first()).toBeVisible()
    const count = await productLinks.count()
    expect(count).toBeGreaterThan(0)
    await productLinks.first().click()

    await expect(page).toHaveURL(/\/shop\/.+/)

    const addToCartBtn = page.getByRole('button', { name: /Add to Cart/i })
    await expect(addToCartBtn).toBeVisible()
    await addToCartBtn.click()

    const cartBadge = page.locator('a[href="/cart"]').first()
    await expect(cartBadge).toBeVisible()
  })

  test('T3: Cart shows added item', async ({ page }) => {
    await page.goto('/shop')
    await page.waitForTimeout(2000)

    const productLinks = page.locator('a[href^="/shop/"][href*="-"]')
    await expect(productLinks.first()).toBeVisible()
    await productLinks.first().click()

    await expect(page).toHaveURL(/\/shop\/.+/)

    const addToCartBtn = page.getByRole('button', { name: /Add to Cart/i })
    await expect(addToCartBtn).toBeVisible()
    await addToCartBtn.click()

    await page.waitForTimeout(1000)

    await page.goto('/cart')
    await expect(page).toHaveURL(/\/cart/)

    const emptyMsg = page.getByText('Your cart is empty')
    const hasEmpty = await emptyMsg.isVisible({ timeout: 3000 }).catch(() => false)
    expect(hasEmpty).toBe(false)
  })

  test('T4: Empty cart message appears when cart is cleared', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    await page.evaluate(() => {
      localStorage.removeItem('otabilhub-cart')
      localStorage.clear()
    })

    await page.goto('/cart')
    await page.waitForTimeout(2000)

    await expect(page).toHaveURL(/\/cart/)
    await expect(page.getByText('Your cart is empty')).toBeVisible({ timeout: 10000 })
  })

  test('T5: Checkout button visible on cart page with items', async ({ page }) => {
    await page.goto('/shop')
    await page.waitForTimeout(2000)

    const productLinks = page.locator('a[href^="/shop/"][href*="-"]')
    await expect(productLinks.first()).toBeVisible()
    await productLinks.first().click()

    await expect(page).toHaveURL(/\/shop\/.+/)

    const addToCartBtn = page.getByRole('button', { name: /Add to Cart/i })
    await expect(addToCartBtn).toBeVisible()
    await addToCartBtn.click()

    await page.waitForTimeout(1000)

    await page.goto('/cart')
    await expect(page).toHaveURL(/\/cart/)

    const checkoutBtn = page.getByRole('link', { name: /Proceed to Checkout/i })
    await expect(checkoutBtn).toBeVisible()
  })

  test('T6: Cart item can be removed', async ({ page }) => {
    await page.goto('/shop')
    await page.waitForTimeout(2000)

    const productLinks = page.locator('a[href^="/shop/"][href*="-"]')
    await expect(productLinks.first()).toBeVisible()
    await productLinks.first().click()

    await expect(page).toHaveURL(/\/shop\/.+/)

    const addToCartBtn = page.getByRole('button', { name: /Add to Cart/i })
    await expect(addToCartBtn).toBeVisible()
    await addToCartBtn.click()

    await page.waitForTimeout(1000)
    await page.goto('/cart')

    const removeBtn = page.locator('[aria-label*="Remove"]').first()
    if (await removeBtn.count() > 0) {
      await removeBtn.click()
      await page.waitForTimeout(1000)
    }

    const emptyMsg = page.getByText('Your cart is empty')
    const hasEmpty = await emptyMsg.isVisible({ timeout: 5000 }).catch(() => false)
    expect(hasEmpty).toBeTruthy()
  })
})
