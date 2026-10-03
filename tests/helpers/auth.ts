import { expect, type Page } from '@playwright/test'

export async function loginAsAdmin(
  page: Page,
  env: { E2E_ADMIN_EMAIL: string; E2E_ADMIN_PASSWORD: string }
) {
  if (!env.E2E_ADMIN_EMAIL || !env.E2E_ADMIN_PASSWORD) {
    throw new Error('E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD must be set in .env.e2e')
  }

  await page.goto('/admin/login')
  await page.locator('#email').waitFor({ state: 'visible' })

  await page.locator('#email').fill(env.E2E_ADMIN_EMAIL)
  await page.locator('#password').fill(env.E2E_ADMIN_PASSWORD)

  const submitBtn = page.getByRole('button', { name: /Sign In/ })
  await expect(submitBtn).toBeVisible()
  await submitBtn.click()

  await page.waitForURL(
    (url) => !url.pathname.includes('/admin/login'),
    // The dev server compiles routes on demand, so the first navigation after
    // a code change can take a long time.
    { timeout: 120000, waitUntil: 'domcontentloaded' }
  )
  await expect(page).not.toHaveURL(/.*admin\/login/, { timeout: 15000 })
}

export async function logout(page: Page) {
  const signOut = page.getByRole('button', { name: 'Sign out' }).first()
  await expect(signOut).toBeVisible({ timeout: 15000 })
  await signOut.click()
  await page.waitForURL(/.*admin\/login.*/, { timeout: 30000 })
}
