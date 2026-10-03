import { test, expect } from './helpers/fixtures'
import { loginAsAdmin } from './helpers/auth'

// A valid 1x1 PNG so the uploaded asset is a real, loadable image.
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
const pngBuffer = Buffer.from(PNG_BASE64, 'base64')

test.describe('Group K: Branding Workflow', () => {
  test('K1: Admin can access branding page', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/branding')
    await expect(page.locator('h1')).toContainText('Branding')
    await expect(page.locator('input[type="file"]')).toBeVisible()
  })

  test('K2: Upload PNG icon persists to database', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/branding')

    await page.locator('input[type="file"]').setInputFiles({
      name: 'icon.png',
      mimeType: 'image/png',
      buffer: pngBuffer,
    })

    const uploadBtn = page.getByRole('button', { name: /Upload Icon/ })
    await expect(uploadBtn).toBeEnabled()
    await uploadBtn.click()

    await expect(page.getByText('Icon uploaded successfully.')).toBeVisible({ timeout: 20000 })

    const res = await page.request.get('/api/branding')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(typeof body.icon_path).toBe('string')
    expect(body.icon_path).toContain('/storage/v1/object/public/branding/')

    // Persists after a full refresh.
    await page.reload()
    await expect(page.locator('input[type="file"]')).toBeVisible()
    const res2 = await page.request.get('/api/branding')
    const body2 = await res2.json()
    expect(body2.icon_path).toBe(body.icon_path)

    // The stored asset URL actually resolves.
    const assetRes = await page.request.get(body.icon_path)
    expect(assetRes.ok()).toBeTruthy()
  })

  test('K3: Invalid file type shows error and does not persist', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/branding')

    await page.locator('input[type="file"]').setInputFiles({
      name: 'icon.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('PDF-TEST', 'utf-8'),
    })

    await expect(
      page.getByText('Invalid file type. Please upload a PNG, JPEG, or ICO file.')
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /Upload Icon/ })).toBeDisabled()
  })

  test('K4: File too large shows error', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/branding')

    await page.locator('input[type="file"]').setInputFiles({
      name: 'large-icon.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(3 * 1024 * 1024, 1),
    })

    await expect(page.getByText('File size must be under 2 MB.')).toBeVisible()
    await expect(page.getByRole('button', { name: /Upload Icon/ })).toBeDisabled()
  })

  test('K5: Public site favicon metadata points to uploaded icon', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/branding')
    await page.locator('input[type="file"]').setInputFiles({
      name: 'icon.png',
      mimeType: 'image/png',
      buffer: pngBuffer,
    })
    await page.getByRole('button', { name: /Upload Icon/ }).click()
    await expect(page.getByText('Icon uploaded successfully.')).toBeVisible({ timeout: 20000 })

    // Visit the public homepage and confirm the metadata icon is the uploaded asset.
    await page.goto('/')
    const iconHref = await page
      .locator('link[rel="icon"]')
      .first()
      .getAttribute('href')
    expect(iconHref).toBeTruthy()
    expect(iconHref).toContain('/storage/v1/object/public/branding/')

    const assetRes = await page.request.get(iconHref!)
    expect(assetRes.ok()).toBeTruthy()
  })
})
