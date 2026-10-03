import { test, expect } from '../helpers/fixtures'

// Smoke test - verify all key pages load without errors
// This tests public pages first, then we'll test auth pages after credentials are set

const viewports = [
  { name: '320px', width: 320, height: 800 },
  { name: '375px', width: 375, height: 812 },
  { name: '390px', width: 390, height: 844 },
  { name: '414px', width: 414, height: 896 },
  { name: '768px', width: 768, height: 1024 },
  { name: '1280px', width: 1280, height: 800 },
]

for (const vp of viewports) {
  test(`${vp.name} - homepage loads`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.goto('/')
    await expect(page).toHaveTitle(/OtabilHub/)
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
    })
    expect(hasOverflow).toBe(false)
  })

  test(`${vp.name} - shop page loads`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.goto('/shop')
    await expect(page).toHaveURL(/.*shop/)
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
    })
    expect(hasOverflow).toBe(false)
  })
}

test.describe('Public pages', () => {
  test('homepage loads at 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await expect(page).toHaveTitle(/OtabilHub/)
  })

  test('shop page loads at 1280px', async ({ page }) => {
    await page.goto('/shop')
    await expect(page).toHaveURL(/.*shop/)
  })

  test('services page loads at 1280px', async ({ page }) => {
    await page.goto('/services')
    await expect(page).toHaveURL(/.*services/)
  })

  test('contact page loads at 1280px', async ({ page }) => {
    await page.goto('/contact')
    await expect(page).toHaveURL(/.*contact/)
  })

  test('about page loads at 1280px', async ({ page }) => {
    await page.goto('/about')
    await expect(page).toHaveURL(/.*about/)
  })

  test('login page loads at 1280px', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/.*login/)
  })

  test('signup page loads at 1280px', async ({ page }) => {
    await page.goto('/signup')
    await expect(page).toHaveURL(/.*signup/)
  })

  test('cart page loads at 1280px', async ({ page }) => {
    await page.goto('/cart')
    await expect(page).toHaveURL(/.*cart/)
  })

  test('checkout page loads at 1280px', async ({ page }) => {
    await page.goto('/checkout')
    await expect(page).toHaveURL(/.*checkout/)
  })

  test('login page loads at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.goto('/login')
    await expect(page).toHaveURL(/.*login/)
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
    })
    expect(hasOverflow).toBe(false)
  })

  test('login page loads at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/login')
    await expect(page).toHaveURL(/.*login/)
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
    })
    expect(hasOverflow).toBe(false)
  })
})
