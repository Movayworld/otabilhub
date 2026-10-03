import { test, expect, loadEnv, type EnvVars } from './helpers/fixtures'
import { loginAsAdmin } from './helpers/auth'
import { adminDbClient } from './helpers/db'
import {
  addToCartViaStorefront,
  cleanupCatalog,
  createDeliveryLocation,
  createPublishedProduct,
  type CreatedLocation,
} from './helpers/catalog'

const GHS = (n: number) =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
  }).format(n)

async function setupCatalog(page: import('@playwright/test').Page, env: EnvVars) {
  await loginAsAdmin(page, env)
  const location = await createDeliveryLocation(page, env, { fee: '25' })
  const product = await createPublishedProduct(page, env, { price: '100', stock: '10' })
  return { product, location }
}

async function fillCheckoutForm(
  page: import('@playwright/test').Page,
  location: CreatedLocation,
  email = 'playwright.checkout@example.com'
) {
  await page.locator('#fullName').fill('Playwright Checkout Customer')
  await page.locator('#phone').fill('0244123456')
  await page.locator('#email').fill(email)
  await page.locator('#address').fill('12 Playwright Test Street')
  await page.locator('#city').fill('Accra')
  await page.locator('#deliveryLocation').selectOption(location.id)
}

/**
 * Reads a value from the order summary. Each summary line is
 * `<div class="flex justify-between"><span>Label</span><span>Value</span></div>`,
 * so the value is the label's next sibling span. Exact matching avoids
 * "Total" also matching "Subtotal".
 */
async function summaryValue(page: import('@playwright/test').Page, label: string) {
  const value = page
    .getByText(label, { exact: true })
    .locator('xpath=following-sibling::span[1]')
  await expect(value).toBeVisible()
  return ((await value.textContent()) ?? '').trim()
}

type OrderRow = Record<string, string | number | boolean | null>

async function fetchOrder(env: EnvVars, orderId: string): Promise<OrderRow | null> {
  const db = await adminDbClient(env)
  const { data } = await db
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle()
  return (data as OrderRow | null) ?? null
}

test.describe.configure({ mode: 'serial' })

test.describe('Group G: Checkout Workflow', () => {
  test.afterAll(async () => {
    await cleanupCatalog(loadEnv())
  })

  test('G1: An empty cart shows the empty state and cannot be checked out', async ({ page }) => {
    await page.goto('/checkout')
    await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible({
      timeout: 45000,
    })
    await expect(page.getByRole('button', { name: 'Place Order & Pay' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Continue Shopping' })).toBeVisible()
  })

  test('G2: Guest checkout creates an order, reduces stock and records a SALE movement', async ({
    page,
    env,
  }) => {
    const { product, location } = await setupCatalog(page, env)

    // Browse and buy as an anonymous guest.
    await page.context().clearCookies()
    await addToCartViaStorefront(page, product, 2)

    await page.goto('/cart')
    await expect(page.getByText(product.name)).toBeVisible({ timeout: 45000 })

    await page.goto('/checkout')
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible({ timeout: 45000 })
    // Subtotal reflects 2 x 100 from the cart.
    expect(await summaryValue(page, 'Subtotal (2 items)')).toBe(GHS(200))
    // No delivery selected yet, so the total equals the subtotal.
    expect(await summaryValue(page, 'Total')).toBe(GHS(200))

    await fillCheckoutForm(page, location)
    await expect(page.getByText('Delivery to:')).toContainText(location.name)
    await expect(page.getByText('Estimated delivery: 2 days')).toBeVisible()
    expect(await summaryValue(page, 'Delivery')).toBe(GHS(25))
    expect(await summaryValue(page, 'Total')).toBe(GHS(225))

    await page.getByRole('button', { name: 'Place Order & Pay' }).click()

    await page.waitForURL(/\/order-success\/[0-9a-f-]{36}\?token=[0-9a-f-]{36}/, {
      timeout: 90000,
    })
    await expect(page.getByRole('heading', { name: 'Order received' })).toBeVisible({
      timeout: 60000,
    })

    const url = new URL(page.url())
    const orderId = url.pathname.split('/').pop() as string
    const guestToken = url.searchParams.get('token') as string
    expect(guestToken).toBeTruthy()

    // Order row.
    const db = await adminDbClient(env)
    await expect
      .poll(async () => (await fetchOrder(env, orderId)) !== null, {
        timeout: 30000,
        message: 'order row was never created',
      })
      .toBe(true)

    const order = (await fetchOrder(env, orderId)) as OrderRow
    expect(order.status).toBe('pending')
    expect(order.payment_state).toBe('pending')
    expect(order.currency).toBe('GHS')
    expect(Number(order.total)).toBe(225)
    expect(Number(order.delivery_fee)).toBe(25)
    expect(order.delivery_location_id).toBe(location.id)
    expect(order.delivery_location_name).toBe(location.name)
    expect(order.delivery_estimated).toBe('2 days')
    expect(order.guest_access_token).toBe(guestToken)
    expect(order.profile_id).toBeNull()
    expect(order.shipping_address).toBe('12 Playwright Test Street')
    expect(order.city).toBe('Accra')
    expect(order.phone).toBe('0244123456')

    // Order items.
    const { data: items, error: itemsError } = await db
      .from('order_items')
      .select('product_id, product_name, product_price, quantity, total_price')
      .eq('order_id', orderId)
    expect(itemsError).toBeNull()
    expect(items).toHaveLength(1)
    const item = items![0] as Record<string, string | number>
    expect(item.product_id).toBe(product.id)
    expect(item.product_name).toBe(product.name)
    expect(Number(item.product_price)).toBe(100)
    expect(item.quantity).toBe(2)
    expect(Number(item.total_price)).toBe(200)

    // Stock reduced from 10 to 8.
    const { data: productRow } = await db
      .from('products')
      .select('stock_quantity')
      .eq('id', product.id)
      .single()
    expect((productRow as { stock_quantity: number }).stock_quantity).toBe(8)

    // Exactly one SALE movement referencing the order.
    const { data: movements } = await db
      .from('inventory_movements')
      .select('movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id')
      .eq('reference_id', orderId)
    expect(movements).toHaveLength(1)
    const movement = movements![0] as Record<string, string | number>
    expect(movement.movement_type).toBe('SALE')
    expect(movement.quantity_change).toBe(-2)
    expect(movement.quantity_before).toBe(10)
    expect(movement.quantity_after).toBe(8)
    expect(movement.reference_type).toBe('ORDER')

    // The cart must be cleared after a successful order.
    await page.goto('/cart')
    await expect(page.getByText(product.name)).toHaveCount(0, { timeout: 45000 })
  })

  test('G3: Invalid customer details are rejected and no order is created', async ({
    page,
    env,
  }) => {
    const { product, location } = await setupCatalog(page, env)

    const db = await adminDbClient(env)
    const { count: ordersBefore } = await db
      .from('orders')
      .select('id', { count: 'exact', head: true })

    await page.context().clearCookies()
    await addToCartViaStorefront(page, product, 1)
    await page.goto('/checkout')
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible({ timeout: 45000 })

    await page.locator('#fullName').fill('A')
    await page.locator('#phone').fill('123')
    await page.locator('#email').fill('not-an-email')
    await page.locator('#address').fill('abc')
    await page.locator('#city').fill('A')
    await page.locator('#deliveryLocation').selectOption(location.id)
    await page.getByRole('button', { name: 'Place Order & Pay' }).click()

    await expect(page.getByText('Please enter your full name.')).toBeVisible({ timeout: 20000 })
    await expect(page.getByText('Please enter a valid phone number.')).toBeVisible()
    await expect(page.getByText('Please enter a valid email address.')).toBeVisible()
    await expect(page.getByText('Please enter your shipping address.')).toBeVisible()
    await expect(page.getByText('Please enter your city.')).toBeVisible()
    // Still on checkout, no order created.
    await expect(page).toHaveURL(/\/checkout$/)

    const { count: ordersAfter } = await db
      .from('orders')
      .select('id', { count: 'exact', head: true })
    expect(ordersAfter).toBe(ordersBefore)
  })

  test('G4: The server uses the database delivery fee, not the client value', async ({
    page,
    env,
  }) => {
    const { product, location } = await setupCatalog(page, env)

    await page.context().clearCookies()
    await addToCartViaStorefront(page, product, 1)
    await page.goto('/checkout')
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible({ timeout: 45000 })
    await fillCheckoutForm(page, location)

    // The client now shows the 25.00 fee. Change it in the database behind the
    // client's back so any client-supplied value would be stale/manipulated.
    expect(await summaryValue(page, 'Delivery')).toBe(GHS(25))
    expect(await summaryValue(page, 'Total')).toBe(GHS(125))
    const db = await adminDbClient(env)
    const { error: feeError } = await db
      .from('delivery_locations')
      .update({ delivery_fee: 40 })
      .eq('id', location.id)
    expect(feeError).toBeNull()

    await page.getByRole('button', { name: 'Place Order & Pay' }).click()
    await page.waitForURL(/\/order-success\/[0-9a-f-]{36}/, { timeout: 90000 })

    const orderId = new URL(page.url()).pathname.split('/').pop() as string
    await expect
      .poll(async () => (await fetchOrder(env, orderId)) !== null, { timeout: 30000 })
      .toBe(true)

    const order = (await fetchOrder(env, orderId)) as OrderRow
    // Server-computed values: 100 subtotal + 40 database fee.
    expect(Number(order.delivery_fee)).toBe(40)
    expect(Number(order.total)).toBe(140)
  })

  test('G5: An order cannot be placed when stock is insufficient', async ({ page, env }) => {
    const { product, location } = await setupCatalog(page, env)

    await page.context().clearCookies()
    await addToCartViaStorefront(page, product, 1)
    await page.goto('/checkout')
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible({ timeout: 45000 })
    await fillCheckoutForm(page, location)

    const db = await adminDbClient(env)
    const { count: ordersBefore } = await db
      .from('orders')
      .select('id', { count: 'exact', head: true })

    // Drain the stock after the cart was built.
    const { error } = await db.from('products').update({ stock_quantity: 0 }).eq('id', product.id)
    expect(error).toBeNull()

    await page.getByRole('button', { name: 'Place Order & Pay' }).click()

    await expect(
      page.getByText(`${product.name} no longer has sufficient stock for the requested quantity.`)
    ).toBeVisible({ timeout: 90000 })
    await expect(page).toHaveURL(/\/checkout$/)

    const { count: ordersAfter } = await db
      .from('orders')
      .select('id', { count: 'exact', head: true })
    // No order was created for this attempt.
    expect(ordersAfter).toBe(ordersBefore)
  })

  test('G6: An unpublished product cannot be ordered', async ({ page, env }) => {
    const { product, location } = await setupCatalog(page, env)

    await page.context().clearCookies()
    await addToCartViaStorefront(page, product, 1)
    await page.goto('/checkout')
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible({ timeout: 45000 })
    await fillCheckoutForm(page, location)

    const db = await adminDbClient(env)
    const { error } = await db
      .from('products')
      .update({ is_published: false })
      .eq('id', product.id)
    expect(error).toBeNull()

    await page.getByRole('button', { name: 'Place Order & Pay' }).click()

    await expect(page.getByText(`${product.name} is no longer available.`)).toBeVisible({
      timeout: 90000,
    })
    await expect(page).toHaveURL(/\/checkout$/)
  })

  test('G7: Checkout requires a delivery location before ordering', async ({ page, env }) => {
    const { product } = await setupCatalog(page, env)

    await page.context().clearCookies()
    await addToCartViaStorefront(page, product, 1)
    await page.goto('/checkout')
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible({ timeout: 45000 })

    await page.locator('#fullName').fill('Playwright Checkout Customer')
    await page.locator('#phone').fill('0244123456')
    await page.locator('#email').fill('playwright.checkout@example.com')
    await page.locator('#address').fill('12 Playwright Test Street')
    await page.locator('#city').fill('Accra')

    // Without a location the submit button stays disabled and a hint is shown.
    await expect(page.getByRole('button', { name: 'Place Order & Pay' })).toBeDisabled()
    await expect(page.getByText('Select a delivery location to continue.')).toBeVisible()
  })
})
