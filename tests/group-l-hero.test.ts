import { test, expect, loadEnv, type EnvVars } from './helpers/fixtures'
import { loginAsAdmin } from './helpers/auth'
import { adminDbClient } from './helpers/db'

// A valid 1x1 PNG so the uploaded hero asset is a real, decodable image.
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
const pngBuffer = Buffer.from(PNG_BASE64, 'base64')

const TEST_PREFIX = 'PLAYWRIGHT TEST'
const SAVED_TEXT = 'Hero configuration saved.'

/** Decodes a next/image optimizer URL back to the underlying asset URL. */
function decodeImageSrc(src: string): string {
  if (!src.startsWith('/_next/image')) return src
  const url = new URL(src, 'http://localhost')
  return decodeURIComponent(url.searchParams.get('url') || '')
}

/**
 * Polls the database until the active hero config carries the expected value.
 * The server action + router.refresh() round trip is asynchronous, so the DB
 * is the authoritative signal that the write landed.
 */
async function waitForHeroField(env: EnvVars, field: string, expected: string) {
  const db = await adminDbClient(env)
  await expect
    .poll(
      async () => {
        const { data } = await db
          .from('hero_configs')
          .select(field)
          .eq('is_active', true)
          .maybeSingle()
        return (data as Record<string, unknown> | null)?.[field] ?? null
      },
      { timeout: 45000, message: `active hero config "${field}" never became "${expected}"` }
    )
    .toBe(expected)
}

/** No error banner may be showing once a save has settled. */
async function expectNoHeroError(page: import('@playwright/test').Page) {
  const banner = page.getByText(/Failed to (create|update) hero configuration/)
  await expect(banner).toHaveCount(0)
}

// These tests all mutate the single "active" hero config, so they must not
// run concurrently with each other.
test.describe.configure({ mode: 'serial' })

test.describe('Group L: Hero Workflow', () => {
  // Only ever deletes hero rows created by these tests. Real hero configs
  // never carry the PLAYWRIGHT TEST prefix.
  async function cleanupTestHeroes() {
    const db = await adminDbClient(loadEnv())
    const { data: rows, error } = await db
      .from('hero_configs')
      .select('id')
      .like('heading', `${TEST_PREFIX}%`)
    expect(error).toBeNull()
    const ids = (rows ?? []).map((r) => (r as { id: string }).id)
    if (ids.length > 0) {
      const { error: delError } = await db.from('hero_configs').delete().in('id', ids)
      expect(delError).toBeNull()
    }
  }

  test.beforeAll(cleanupTestHeroes)
  test.afterAll(cleanupTestHeroes)

  test('L1: Admin can access hero page with editable config form', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/hero')
    await expect(page.locator('h1').first()).toContainText('Homepage Hero')
    await expect(page.locator('#heading')).toBeVisible()
    await expect(page.locator('#subheading')).toBeVisible()
    await expect(page.locator('#primaryCtaText')).toBeVisible()
    await expect(page.locator('#primaryCtaUrl')).toBeVisible()
    await expect(page.locator('input[type="file"]')).toHaveCount(1)
  })

  test('L2: Hero image upload creates config stored in DB and rendered on homepage', async ({
    page,
    env,
  }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/hero')

    const heading = `${TEST_PREFIX} — Hero Upload ${Date.now()}`
    await page.locator('#heading').fill(heading)

    await page.locator('input[type="file"]').setInputFiles({
      name: 'hero.png',
      mimeType: 'image/png',
      buffer: pngBuffer,
    })

    // The form auto-saves after a successful upload.
    await waitForHeroField(env, 'heading', heading)
    await expectNoHeroError(page)

    // Database: the active config must reference a real storage object.
    const db = await adminDbClient(env)
    const { data, error } = await db
      .from('hero_configs')
      .select('id, heading, image_url, is_active')
      .eq('is_active', true)
      .single()

    expect(error).toBeNull()
    const row = data as { id: string; heading: string; image_url: string; is_active: boolean }
    expect(row.heading).toBe(heading)
    expect(row.is_active).toBe(true)
    expect(row.image_url).toContain('/storage/v1/object/public/product-images/hero/')

    // The stored asset must actually resolve.
    const assetRes = await page.request.get(row.image_url)
    expect(assetRes.ok()).toBeTruthy()

    // Storefront: homepage must render the saved heading and the uploaded image.
    await page.goto('/')
    await expect(page.getByTestId('hero-heading')).toContainText(heading)
    const heroImg = page.getByTestId('hero-image')
    await expect(heroImg).toBeVisible()
    const imgSrc = await heroImg.getAttribute('src')
    expect(imgSrc).toBeTruthy()
    expect(decodeImageSrc(imgSrc!)).toContain('/storage/v1/object/public/product-images/hero/')

    // The next/image optimizer must be able to serve the remote asset; this
    // proves the Supabase host is configured in next.config.mjs remotePatterns.
    const optimizerRes = await page.request.get(imgSrc!)
    expect(optimizerRes.ok()).toBeTruthy()

    await heroImg.evaluate((el: HTMLImageElement) =>
      el.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            el.addEventListener('load', () => resolve(), { once: true })
            el.addEventListener('error', () => resolve(), { once: true })
          })
    )
    const naturalWidth = await heroImg.evaluate((el: HTMLImageElement) => el.naturalWidth)
    expect(naturalWidth).toBeGreaterThan(0)
  })

  test('L3: Hero config edits persist after reload, confirm in UI, and reach the homepage', async ({
    page,
    env,
  }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/hero')

    const heading = `${TEST_PREFIX} — Hero Edit ${Date.now()}`
    const subheading = `${TEST_PREFIX} subheading`
    const ctaText = `${TEST_PREFIX} CTA`

    await page.locator('#heading').fill(heading)
    await page.locator('#subheading').fill(subheading)
    await page.locator('#primaryCtaText').fill(ctaText)
    await page.locator('#primaryCtaUrl').fill('/shop')
    await page.locator('#secondaryCtaText').fill(`${TEST_PREFIX} Secondary`)
    await page.locator('#secondaryCtaUrl').fill('/services')

    await page.getByRole('button', { name: /Save Hero/ }).click()

    // The admin must get explicit confirmation of the save.
    await expect(page.getByText(SAVED_TEXT)).toBeVisible({ timeout: 45000 })
    await waitForHeroField(env, 'heading', heading)
    await expectNoHeroError(page)

    // Reload: the saved values must be repopulated in the form.
    await page.reload()
    await expect(page.locator('#heading')).toHaveValue(heading)
    await expect(page.locator('#subheading')).toHaveValue(subheading)
    await expect(page.locator('#primaryCtaText')).toHaveValue(ctaText)
    await expect(page.locator('#secondaryCtaText')).toHaveValue(`${TEST_PREFIX} Secondary`)

    // Database consistency.
    const db = await adminDbClient(env)
    const { data: rows, error } = await db
      .from('hero_configs')
      .select(
        'heading, subheading, primary_cta_text, primary_cta_url, secondary_cta_text, secondary_cta_url'
      )
      .eq('is_active', true)
    expect(error).toBeNull()
    expect(rows).toHaveLength(1)
    const row = rows![0] as Record<string, string | null>
    expect(row.heading).toBe(heading)
    expect(row.subheading).toBe(subheading)
    expect(row.primary_cta_text).toBe(ctaText)
    expect(row.primary_cta_url).toBe('/shop')
    expect(row.secondary_cta_text).toBe(`${TEST_PREFIX} Secondary`)
    expect(row.secondary_cta_url).toBe('/services')

    // Storefront consistency.
    await page.goto('/')
    await expect(page.getByTestId('hero-heading')).toContainText(heading)
    await expect(page.getByTestId('hero-subheading')).toContainText(subheading)
    await expect(page.getByTestId('hero-primary-cta')).toContainText(ctaText)
    await expect(page.getByTestId('hero-secondary-cta')).toContainText(`${TEST_PREFIX} Secondary`)
  })

  test('L4: Hero primary CTA URL is followed on the homepage', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/hero')

    await page.locator('#primaryCtaUrl').fill('/services')
    await page.getByRole('button', { name: /Save Hero/ }).click()

    await waitForHeroField(env, 'primary_cta_url', '/services')
    await expectNoHeroError(page)

    await page.goto('/')
    const cta = page.getByTestId('hero-primary-cta')
    await expect(cta).toBeVisible()
    await cta.click()
    await page.waitForURL(/\/services$/, { timeout: 20000 })
    await expect(page).toHaveURL(/\/services$/)
  })

  test('L5: Saving without a required heading reports an error and does not persist', async ({
    page,
    env,
  }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/hero')

    const db = await adminDbClient(env)

    // Establish a known-good active config first.
    const heading = `${TEST_PREFIX} — Hero Validation ${Date.now()}`
    await page.locator('#heading').fill(heading)
    await page.getByRole('button', { name: /Save Hero/ }).click()
    await waitForHeroField(env, 'heading', heading)

    // Now attempt an invalid save.
    await page.locator('#heading').fill('')
    await page.getByRole('button', { name: /Save Hero/ }).click()

    await expect(
      page.getByText('Image URL, heading, primary CTA text, and primary CTA URL are required.')
    ).toBeVisible({ timeout: 15000 })

    // The invalid save must not have changed the stored config.
    const { data: after } = await db
      .from('hero_configs')
      .select('heading')
      .eq('is_active', true)
      .single()
    expect((after as { heading: string } | null)?.heading).toBe(heading)
  })
})
