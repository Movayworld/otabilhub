import { test, expect } from '../helpers/fixtures'

test('homepage loads', async ({ page }) => {
  await page.goto('http://localhost:3000')
  const title = await page.title()
  console.log('Page title:', title)
  expect(title).toContain('OtabilHub')
})
