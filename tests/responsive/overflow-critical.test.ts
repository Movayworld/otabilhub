import { test, expect } from '../helpers/fixtures'

// Focused overflow test - critical pages at mobile viewports
const viewports = [
  { width: 320, height: 800, name: '320px' },
  { width: 375, height: 812, name: '375px' },
  { width: 414, height: 896, name: '414px' },
]

const pages = ['/', '/shop', '/cart', '/checkout', '/login']

for (const vp of viewports) {
  for (const path of pages) {
    test(`${vp.name} - ${path} no overflow`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto(`http://localhost:3000${path}`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(3000)
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth
      })
      if (hasOverflow) {
        await page.screenshot({ path: `test-results/overflow-${vp.name}-${path.replace(/\//g, '_') || 'home'}.png` })
      }
      expect(hasOverflow).toBe(false)
    })
  }
}
