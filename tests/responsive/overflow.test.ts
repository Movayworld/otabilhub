import { test, expect } from '../helpers/fixtures'

// Test overflow at multiple mobile viewports
const mobileViewports = [
  { width: 320, height: 800, name: '320px' },
  { width: 375, height: 812, name: '375px' },
  { width: 390, height: 844, name: '390px' },
  { width: 414, height: 896, name: '414px' },
]

const publicPages = ['/', '/shop', '/services', '/contact', '/about', '/cart', '/checkout', '/login', '/signup', '/forgot-password']

for (const vp of mobileViewports) {
  for (const path of publicPages) {
    test(`${vp.name} - ${path} no overflow`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto(`http://localhost:3000${path}`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth
      })
      if (hasOverflow) {
        // Take screenshot for debugging
        await page.screenshot({ path: `test-results/overflow-${vp.name}-${path.replace(/\//g, '_') || 'home'}.png` })
      }
      expect(hasOverflow).toBe(false)
    })
  }
}
