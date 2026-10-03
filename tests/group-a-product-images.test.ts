import { test, expect, loadEnv, type EnvVars } from './helpers/fixtures'
import { loginAsAdmin } from './helpers/auth'
import { adminDbClient } from './helpers/db'

const TEST_PREFIX = 'PLAYWRIGHT TEST'

// Valid 1x1 PNG so uploaded assets are real, decodable images.
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
const pngBuffer = Buffer.from(PNG_BASE64, 'base64')

const PREVIEW_SELECTOR = 'img[src*="/storage/v1/object/public/product-images/"]'

function productSpec() {
  const stamp = Date.now()
  return {
    name: `${TEST_PREFIX} Image Product ${stamp}`,
    slug: `playwright-test-image-product-${stamp}`,
  }
}

/** Creates a product through the real admin UI and lands on its edit page. */
async function createProductOnEditPage(
  page: import('@playwright/test').Page,
  spec: ReturnType<typeof productSpec>
): Promise<string> {
  await page.goto('/admin/products/new')
  await page.locator('#name').fill(spec.name)
  await page.locator('#slug').fill(spec.slug)
  await page.locator('#price').fill('50')
  await page.locator('#stock_quantity').fill('5')
  await page.locator('#description').fill('Automated Playwright image test product')
  await page.locator('#short_description').fill('Image test product')
  await page.locator('#is_available').check()
  await page.locator('#is_published').check()
  await page.getByRole('button', { name: 'Create Product' }).click()
  await page.waitForURL(/\/admin\/products\/[0-9a-f-]{36}$/, { timeout: 60000 })
  await expect(page.getByRole('heading', { name: 'Edit Product' })).toBeVisible({ timeout: 60000 })
  return page.url().split('/').pop() as string
}

type ImageRow = {
  id: string
  image_url: string
  alt_text: string | null
  is_primary: boolean
  position: number
}

async function fetchImages(env: EnvVars, productId: string): Promise<ImageRow[]> {
  const db = await adminDbClient(env)
  const { data, error } = await db
    .from('product_images')
    .select('id, image_url, alt_text, is_primary, position')
    .eq('product_id', productId)
    .order('position', { ascending: true })
  expect(error).toBeNull()
  return (data ?? []) as ImageRow[]
}

/**
 * Uploads files through the real UI and waits for the durable outcome:
 * the image rows in the database AND the previews rendered in the form.
 */
async function uploadImages(
  page: import('@playwright/test').Page,
  env: EnvVars,
  productId: string,
  files: Array<{ name: string }>,
  expectedCount: number
): Promise<ImageRow[]> {
  await page.locator('input[type="file"]').setInputFiles(
    files.map((f) => ({ name: f.name, mimeType: 'image/png', buffer: pngBuffer }))
  )

  await expect
    .poll(async () => (await fetchImages(env, productId)).length, {
      timeout: 90000,
      message: `expected ${expectedCount} product image row(s) after upload`,
    })
    .toBe(expectedCount)

  // No upload error may be displayed.
  await expect(page.locator('.bg-red-50')).toHaveCount(0)

  // The admin UI must show the uploaded previews.
  await expect(page.locator(PREVIEW_SELECTOR)).toHaveCount(expectedCount, { timeout: 60000 })

  return fetchImages(env, productId)
}

/** Extracts the storage path (bucket-relative) from a public image URL. */
function storagePathOf(imageUrl: string): string {
  const url = new URL(imageUrl)
  const prefix = '/storage/v1/object/public/product-images/'
  const idx = url.pathname.indexOf(prefix)
  if (idx === -1) throw new Error(`Not a product-images URL: ${imageUrl}`)
  return decodeURIComponent(url.pathname.slice(idx + prefix.length))
}

/** Lists the object names currently stored for a product (authoritative). */
async function listStoredObjects(env: EnvVars, productId: string): Promise<string[]> {
  const db = await adminDbClient(env)
  const { data, error } = await db.storage.from('product-images').list(productId)
  expect(error).toBeNull()
  return (data ?? []).map((o) => `${productId}/${o.name}`)
}

async function cleanupTestProducts() {
  const env = loadEnv()
  const db = await adminDbClient(env)
  const { data } = await db.from('products').select('id').like('name', `${TEST_PREFIX} Image%`)
  const ids = (data ?? []).map((r) => (r as { id: string }).id)
  if (ids.length === 0) return

  // Remove stored assets first: product_images rows cascade with the product,
  // but storage objects do not.
  const { data: images } = await db
    .from('product_images')
    .select('image_url')
    .in('product_id', ids)
  const paths = (images ?? [])
    .map((r) => {
      try {
        return storagePathOf((r as { image_url: string }).image_url)
      } catch {
        return null
      }
    })
    .filter((p): p is string => Boolean(p))
  if (paths.length > 0) {
    await db.storage.from('product-images').remove(paths)
  }

  await db.from('products').delete().in('id', ids)
}

test.describe.configure({ mode: 'serial' })

test.describe('Group A: Product Image Management', () => {
  test.beforeAll(cleanupTestProducts)
  test.afterAll(cleanupTestProducts)

  test('A1: Uploading two images at once stores both with a defined primary', async ({
    page,
    env,
  }) => {
    await loginAsAdmin(page, env)
    const spec = productSpec()
    const productId = await createProductOnEditPage(page, spec)

    const images = await uploadImages(
      page,
      env,
      productId,
      [{ name: 'image-1.png' }, { name: 'image-2.png' }],
      2
    )

    // Exactly one primary, and it must be the first uploaded image.
    const primaries = images.filter((i) => i.is_primary)
    expect(primaries).toHaveLength(1)
    expect(primaries[0].alt_text).toBe('image-1.png')
    // Positions must be ordered, not all zero.
    expect(images.map((i) => i.position)).toEqual([0, 1])

    for (const img of images) {
      expect(img.image_url).toContain('/storage/v1/object/public/product-images/')
      const res = await page.request.get(img.image_url)
      expect(res.ok(), `image URL did not resolve: ${img.image_url}`).toBeTruthy()
    }

    // Previews and the primary indicator survive a full reload.
    await page.reload()
    await expect(page.locator(PREVIEW_SELECTOR)).toHaveCount(2, { timeout: 60000 })
    await expect(page.getByRole('button', { name: 'Primary', exact: true })).toHaveCount(1)
    await expect(page.getByRole('button', { name: 'Set Primary' })).toHaveCount(1)
  })

  test('A2: Setting a different image as primary moves the primary flag', async ({
    page,
    env,
  }) => {
    await loginAsAdmin(page, env)
    const spec = productSpec()
    const productId = await createProductOnEditPage(page, spec)

    await uploadImages(
      page,
      env,
      productId,
      [{ name: 'first.png' }, { name: 'second.png' }],
      2
    )
    await page.reload()
    await expect(page.locator(PREVIEW_SELECTOR)).toHaveCount(2, { timeout: 60000 })

    const secondCard = page
      .locator('div.relative.group')
      .filter({ has: page.locator('img[alt="second.png"]') })
    await secondCard.getByRole('button', { name: 'Set Primary' }).click()

    await expect
      .poll(
        async () => {
          const images = await fetchImages(env, productId)
          return images.find((i) => i.is_primary)?.alt_text ?? null
        },
        { timeout: 60000, message: 'primary flag never moved to the second image' }
      )
      .toBe('second.png')

    // Exactly one primary must exist at any time.
    const images = await fetchImages(env, productId)
    expect(images.filter((i) => i.is_primary)).toHaveLength(1)
    await expect(page.getByRole('button', { name: 'Primary', exact: true })).toHaveCount(1, {
      timeout: 30000,
    })
  })

  test('A3: Deleting an image removes the record and the storage object', async ({
    page,
    env,
  }) => {
    await loginAsAdmin(page, env)
    const spec = productSpec()
    const productId = await createProductOnEditPage(page, spec)

    const images = await uploadImages(
      page,
      env,
      productId,
      [{ name: 'keep.png' }, { name: 'remove.png' }],
      2
    )
    const target = images.find((i) => i.alt_text === 'remove.png') as ImageRow

    await page.reload()
    await expect(page.locator(PREVIEW_SELECTOR)).toHaveCount(2, { timeout: 60000 })

    const card = page
      .locator('div.relative.group')
      .filter({ has: page.locator('img[alt="remove.png"]') })
    page.once('dialog', (dialog) => dialog.accept())
    await card.getByRole('button', { name: 'Delete' }).click()

    await expect
      .poll(async () => (await fetchImages(env, productId)).length, {
        timeout: 60000,
        message: 'image row was never deleted',
      })
      .toBe(1)

    const remaining = await fetchImages(env, productId)
    expect(remaining[0].alt_text).toBe('keep.png')

    // The storage object must be removed too, not just the row. The public URL
    // can still be served from the CDN cache, so assert against the Storage API.
    const targetPath = storagePathOf(target.image_url)
    await expect
      .poll(async () => (await listStoredObjects(env, productId)).includes(targetPath), {
        timeout: 30000,
        message: 'deleted image asset is still stored',
      })
      .toBe(false)

    // The retained image must still be stored and reachable.
    expect(await listStoredObjects(env, productId)).toContain(
      storagePathOf(remaining[0].image_url)
    )
    expect((await page.request.get(remaining[0].image_url)).ok()).toBeTruthy()

    // Only one preview remains in the admin UI.
    await expect(page.locator(PREVIEW_SELECTOR)).toHaveCount(1, { timeout: 60000 })
  })

  test('A4: An unsupported file type is rejected with a clear error', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    const spec = productSpec()
    const productId = await createProductOnEditPage(page, spec)

    await page.locator('input[type="file"]').setInputFiles({
      name: 'document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('PDF-TEST', 'utf-8'),
    })

    await expect(
      page.getByText(/document\.pdf: unsupported file type\. Use a JPEG, PNG, WebP, or GIF image\./)
    ).toBeVisible({ timeout: 20000 })

    expect(await fetchImages(env, productId)).toHaveLength(0)
  })

  test('A5: An oversized file is rejected with a clear error', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    const spec = productSpec()
    const productId = await createProductOnEditPage(page, spec)

    await page.locator('input[type="file"]').setInputFiles({
      name: 'huge.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(11 * 1024 * 1024, 1),
    })

    await expect(page.getByText(/huge\.png: file is larger than 10 MB\./)).toBeVisible({
      timeout: 20000,
    })

    expect(await fetchImages(env, productId)).toHaveLength(0)
  })

  test('A6: Images survive navigating away and returning to the product', async ({
    page,
    env,
  }) => {
    await loginAsAdmin(page, env)
    const spec = productSpec()
    const productId = await createProductOnEditPage(page, spec)

    await uploadImages(
      page,
      env,
      productId,
      [{ name: 'persist-1.png' }, { name: 'persist-2.png' }],
      2
    )

    // Leave and come back through the admin list.
    await page.goto('/admin/products')
    await page.getByRole('link', { name: spec.name }).click()
    await expect(page.getByRole('heading', { name: 'Edit Product' })).toBeVisible()
    await expect(page.locator(PREVIEW_SELECTOR)).toHaveCount(2, { timeout: 60000 })

    expect(await fetchImages(env, productId)).toHaveLength(2)
  })

  test('A7: Storefront product page renders both images with working gallery', async ({
    page,
    env,
  }) => {
    await loginAsAdmin(page, env)
    const spec = productSpec()
    const productId = await createProductOnEditPage(page, spec)

    const images = await uploadImages(
      page,
      env,
      productId,
      [{ name: 'pdp-1.png' }, { name: 'pdp-2.png' }],
      2
    )
    const primary = images.find((i) => i.is_primary) as ImageRow
    const other = images.find((i) => i.id !== primary.id) as ImageRow

    // Browse as an anonymous visitor.
    await page.context().clearCookies()
    await page.goto(`/shop/${spec.slug}`)

    // Thumbnails for both images must be offered.
    await expect(page.getByLabel('View image 1 of 2')).toBeVisible({ timeout: 60000 })
    await expect(page.getByLabel('View image 2 of 2')).toBeVisible()

    const decodeSrc = async () => {
      const src = await page.locator('.aspect-\\[3\\/4\\] img').first().getAttribute('src')
      if (!src) return null
      // next/image may emit a relative or absolute optimizer URL.
      const url = new URL(src, 'http://localhost')
      if (url.pathname.startsWith('/_next/image')) {
        return decodeURIComponent(url.searchParams.get('url') ?? '')
      }
      return src
    }

    // The main image must be the primary one.
    await expect.poll(decodeSrc, { timeout: 30000 }).toBe(primary.image_url)

    const mainImage = page.locator('.aspect-\\[3\\/4\\] img').first()
    await mainImage.evaluate((el: HTMLImageElement) =>
      el.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            el.addEventListener('load', () => resolve(), { once: true })
            el.addEventListener('error', () => resolve(), { once: true })
          })
    )
    expect(await mainImage.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0)

    // Navigate to the second image.
    await page.getByLabel('Next image').click()
    await expect.poll(decodeSrc, { timeout: 30000 }).toBe(other.image_url)
  })

  test('A8: Uploading before the product is saved is rejected with guidance', async ({
    page,
    env,
  }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/products/new')

    await page.locator('input[type="file"]').setInputFiles({
      name: 'early.png',
      mimeType: 'image/png',
      buffer: pngBuffer,
    })

    await expect(
      page.getByText('Please save the product first before uploading images.')
    ).toBeVisible({ timeout: 20000 })
  })
})
