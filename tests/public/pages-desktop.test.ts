import { test, expect } from '../helpers/fixtures'

// Test all key pages at 1280px - check content is visible and no overflow
const pages = [
  { path: '/', name: 'Homepage', selector: 'h1' },
  { path: '/shop', name: 'Shop', selector: 'h1' },
  { path: '/services', name: 'Services', selector: 'h1' },
  { path: '/contact', name: 'Contact', selector: 'h1' },
  { path: '/about', name: 'About', selector: 'h1' },
  { path: '/cart', name: 'Cart', selector: 'h1' },
  { path: '/checkout', name: 'Checkout', selector: 'h1' },
  { path: '/login', name: 'Login', selector: 'h1' },
  { path: '/signup', name: 'Signup', selector: 'h1' },
  { path: '/forgot-password', name: 'Forgot Password', selector: 'h1' },
]

for (const { path, name, selector } of pages) {
  test(`${name} (${path}) loads at 1280px`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`http://localhost:3000${path}`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector(selector, { timeout: 15000 })
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
    })
    expect(hasOverflow).toBe(false)
  })
}
