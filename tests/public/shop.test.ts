import { test, expect } from '../helpers/fixtures'

// Test shop page with actual product loading
test('Shop page loads with products at 1280px', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/shop', { waitUntil: 'load' })
  await page.waitForSelector('h1', { timeout: 30000 })
  await page.waitForTimeout(3000)
  const hasOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth
  })
  expect(hasOverflow).toBe(false)
})

test('Shop page loads at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/shop', { waitUntil: 'load' })
  await page.waitForSelector('h1', { timeout: 30000 })
  await page.waitForTimeout(3000)
  const hasOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth
  })
  expect(hasOverflow).toBe(false)
})
