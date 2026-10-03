import { expect, type Page } from '@playwright/test'
import type { EnvVars } from './fixtures'
import { adminDbClient } from './db'

export const TEST_PREFIX = 'PLAYWRIGHT TEST'

export type CreatedProduct = {
  id: string
  name: string
  slug: string
  price: number
  stock: number
}

export type CreatedLocation = {
  id: string
  name: string
  fee: number
}

/** Creates a delivery location through the real admin UI. */
export async function createDeliveryLocation(
  page: Page,
  env: EnvVars,
  opts: { name?: string; fee?: string; estimated?: string } = {}
): Promise<CreatedLocation> {
  const name = opts.name ?? `${TEST_PREFIX} Delivery ${Date.now()}`
  const fee = opts.fee ?? '25'

  await page.goto('/admin/delivery')
  await page.getByRole('button', { name: 'Add Location' }).first().click()
  await expect(page.getByRole('heading', { name: 'New Location' })).toBeVisible()
  await page.locator('#name').fill(name)
  await page.locator('#region').fill('Greater Accra')
  await page.locator('#city').fill('Accra')
  await page.locator('#delivery_fee').fill(fee)
  await page.locator('#estimated_delivery').fill(opts.estimated ?? '2 days')
  await page.locator('form').getByRole('button', { name: 'Add Location' }).click()
  await expect(page.getByText('Delivery location saved successfully.')).toBeVisible({
    timeout: 45000,
  })

  const db = await adminDbClient(env)
  await expect
    .poll(
      async () => {
        const { data } = await db
          .from('delivery_locations')
          .select('id')
          .eq('name', name)
          .maybeSingle()
        return data ? (data.id as string) : null
      },
      { timeout: 30000, message: `delivery location "${name}" was never created` }
    )
    .not.toBeNull()

  const { data } = await db.from('delivery_locations').select('id').eq('name', name).single()
  return { id: (data as { id: string }).id, name, fee: Number(fee) }
}

/** Creates a published, in-stock product through the real admin UI. */
export async function createPublishedProduct(
  page: Page,
  env: EnvVars,
  opts: { name?: string; price?: string; stock?: string } = {}
): Promise<CreatedProduct> {
  const stamp = Date.now()
  const name = opts.name ?? `${TEST_PREFIX} Checkout Product ${stamp}`
  const slug = `playwright-test-checkout-${stamp}`
  const price = opts.price ?? '100'
  const stock = opts.stock ?? '10'

  await page.goto('/admin/products/new')
  await page.locator('#name').fill(name)
  await page.locator('#slug').fill(slug)
  await page.locator('#price').fill(price)
  await page.locator('#stock_quantity').fill(stock)
  await page.locator('#description').fill('Automated Playwright checkout test product')
  await page.locator('#short_description').fill('Checkout test product')
  await page.locator('#is_available').check()
  await page.locator('#is_published').check()
  await page.getByRole('button', { name: 'Create Product' }).click()
  await page.waitForURL(/\/admin\/products\/[0-9a-f-]{36}$/, { timeout: 90000 })

  const db = await adminDbClient(env)
  await expect
    .poll(
      async () => {
        const { data } = await db.from('products').select('id').eq('slug', slug).maybeSingle()
        return data ? (data.id as string) : null
      },
      { timeout: 45000, message: `product "${slug}" was never created` }
    )
    .not.toBeNull()

  const { data } = await db.from('products').select('id').eq('slug', slug).single()
  return { id: (data as { id: string }).id, name, slug, price: Number(price), stock: Number(stock) }
}

/** Adds a product to the cart through the real storefront PDP. */
export async function addToCartViaStorefront(page: Page, product: CreatedProduct, qty = 1) {
  await page.goto(`/shop/${product.slug}`)
  await expect(page.getByRole('heading', { name: product.name })).toBeVisible({ timeout: 60000 })
  for (let i = 1; i < qty; i++) {
    await page.getByRole('button', { name: 'Increase quantity' }).click()
  }
  await page.getByRole('button', { name: /Add to Cart/ }).click()
}

/** Removes every PLAYWRIGHT TEST delivery location, order and product. */
export async function cleanupCatalog(env: EnvVars) {
  const db = await adminDbClient(env)

  // Orders created by tests reference test products; remove them first so the
  // product delete is not blocked by order references.
  const { data: products } = await db
    .from('products')
    .select('id')
    .like('name', `${TEST_PREFIX}%`)
  const productIds = (products ?? []).map((r) => (r as { id: string }).id)

  if (productIds.length > 0) {
    const { data: items } = await db
      .from('order_items')
      .select('order_id')
      .in('product_id', productIds)
    const orderIds = Array.from(
      new Set((items ?? []).map((r) => (r as { order_id: string }).order_id))
    )
    if (orderIds.length > 0) {
      await db.from('order_items').delete().in('order_id', orderIds)
      await db.from('inventory_movements').delete().in('reference_id', orderIds)
      await db.from('orders').delete().in('id', orderIds)
    }
    // Their stored images would otherwise be orphaned.
    const { data: images } = await db
      .from('product_images')
      .select('image_url')
      .in('product_id', productIds)
    const paths = (images ?? [])
      .map((r) => {
        try {
          const url = new URL((r as { image_url: string }).image_url)
          const prefix = '/storage/v1/object/public/product-images/'
          const idx = url.pathname.indexOf(prefix)
          return idx === -1 ? null : decodeURIComponent(url.pathname.slice(idx + prefix.length))
        } catch {
          return null
        }
      })
      .filter((p): p is string => Boolean(p))
    if (paths.length > 0) await db.storage.from('product-images').remove(paths)

    await db.from('products').delete().in('id', productIds)
  }

  const { data: locations } = await db
    .from('delivery_locations')
    .select('id')
    .like('name', `${TEST_PREFIX}%`)
  const locationIds = (locations ?? []).map((r) => (r as { id: string }).id)
  if (locationIds.length > 0) {
    await db.from('delivery_locations').delete().in('id', locationIds)
  }

  const { data: categories } = await db
    .from('categories')
    .select('id')
    .like('name', `${TEST_PREFIX}%`)
  const categoryIds = (categories ?? []).map((r) => (r as { id: string }).id)
  if (categoryIds.length > 0) {
    await db.from('categories').delete().in('id', categoryIds)
  }
}
