import { test, expect } from '@playwright/test'

test.describe('Group O: Responsive Workflow', () => {
  const viewports = [
    { name: 'mobile-320', width: 320, height: 568 },
    { name: 'mobile-375', width: 375, height: 667 },
    { name: 'mobile-390', width: 390, height: 844 },
    { name: 'mobile-414', width: 414, height: 896 },
    { name: 'tablet-768', width: 768, height: 1024 },
    { name: 'desktop-1280', width: 1280, height: 800 },
  ]

  for (const vp of viewports) {
    test(`O1: No horizontal overflow at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/')
      await page.waitForTimeout(1500)
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      expect(hasOverflow).toBeFalsy()
    })

    test(`O2: Admin no overflow at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/admin')
      await page.waitForTimeout(1500)
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      expect(hasOverflow).toBeFalsy()
    })
  }

  test('O3: Shop page no overflow at mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/shop')
    await page.waitForTimeout(1500)
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasOverflow).toBeFalsy()
  })

  test('O4: Checkout page no overflow at mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/checkout')
    await page.waitForTimeout(1500)
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasOverflow).toBeFalsy()
  })
})