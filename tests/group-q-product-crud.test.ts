import { test, expect, loadEnv, type EnvVars } from './helpers/fixtures'
import { loginAsAdmin } from './helpers/auth'
import { adminDbClient } from './helpers/db'

const TEST_PREFIX = 'PLAYWRIGHT TEST'

// The storefront formats prices with the en-GH locale (GHS cedi symbol).
const GHS = (n: number) =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
  }).format(n)

function productSpec() {
  const stamp = Date.now()
  return {
    name: `${TEST_PREFIX} Smart Switch ${stamp}`,
    slug: `playwright-test-smart-switch-${stamp}`,
    price: '100',
    stock: '10',
    description: 'Automated Playwright test product',
    shortDescription: 'Test smart switch',
  }
}

async function createProductViaUi(
  page: import('@playwright/test').Page,
  spec: ReturnType<typeof productSpec>,
  categoryName?: string
): Promise<void> {
  await page.goto('/admin/products/new')
  await page.locator('#name').fill(spec.name)
  await page.locator('#slug').fill(spec.slug)
  await page.locator('#price').fill(spec.price)
  await page.locator('#stock_quantity').fill(spec.stock)
  await page.locator('#description').fill(spec.description)
  await page.locator('#short_description').fill(spec.shortDescription)
  if (categoryName) {
    await page.locator('#category_id').selectOption({ label: categoryName })
  }
  await page.locator('#is_available').check()
  await page.locator('#is_published').check()
  await page.getByRole('button', { name: 'Create Product' }).click()

  // On success the app redirects to the edit page for the new product.
  await page.waitForURL(/\/admin\/products\/[0-9a-f-]{36}$/, { timeout: 60000 })
  await expect(page.getByRole('heading', { name: 'Edit Product' })).toBeVisible({ timeout: 60000 })
}

async function waitForProduct(env: EnvVars, slug: string) {
  const db = await adminDbClient(env)
  await expect
    .poll(
      async () => {
        const { data } = await db.from('products').select('slug').eq('slug', slug).maybeSingle()
        return data ? (data.slug as string) : null
      },
      { timeout: 45000, message: `product "${slug}" was never created` }
    )
    .toBe(slug)
  return db
}

async function cleanupTestProducts() {
  const db = await adminDbClient(loadEnv())
  const { data } = await db.from('products').select('id').like('name', `${TEST_PREFIX}%`)
  const ids = (data ?? []).map((r) => (r as { id: string }).id)
  if (ids.length > 0) await db.from('products').delete().in('id', ids)
}

// Product CRUD mutates shared state; run sequentially.
test.describe.configure({ mode: 'serial' })

test.describe('Group Q: Product CRUD Workflow', () => {
  test.beforeAll(cleanupTestProducts)
  test.afterAll(cleanupTestProducts)

  let categoryName = ''

  test('Q0 setup: a category exists for product creation', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    categoryName = `${TEST_PREFIX} Product Category ${Date.now()}`

    await page.goto('/admin/categories')
    await page.getByRole('button', { name: /New category|Create first category/ }).first().click()
    await page.locator('#name').fill(categoryName)
    await page.locator('#slug').fill(`playwright-test-cat-${Date.now()}`)
    await page.getByRole('button', { name: 'Create' }).click()
    await expect(
      page.getByTestId('category-row').filter({ hasText: categoryName })
    ).toBeVisible({ timeout: 30000 })
  })

  test('Q1: Admin can view the product list', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/products')
    await expect(page.locator('h1')).toContainText('Products')
    await expect(page.getByRole('link', { name: /Add product/ })).toBeVisible()
  })

  test('Q2: Creating a product persists to the database with all fields', async ({
    page,
    env,
  }) => {
    await loginAsAdmin(page, env)
    const spec = productSpec()
    await createProductViaUi(page, spec, categoryName)

    const db = await waitForProduct(env, spec.slug)
    const { data, error } = await db
      .from('products')
      .select('name, slug, price, stock_quantity, is_available, is_published, short_description')
      .eq('slug', spec.slug)
      .single()
    expect(error).toBeNull()
    const row = data as Record<string, string | number | boolean>
    expect(row.name).toBe(spec.name)
    expect(Number(row.price)).toBe(100)
    expect(row.stock_quantity).toBe(10)
    expect(row.is_available).toBe(true)
    expect(row.is_published).toBe(true)
    expect(row.short_description).toBe(spec.shortDescription)

    // The edit form must be prefilled with the saved values.
    await page.reload()
    await expect(page.locator('#name')).toHaveValue(spec.name)
    await expect(page.locator('#price')).toHaveValue(spec.price)
    await expect(page.locator('#stock_quantity')).toHaveValue(spec.stock)
  })

  test('Q3: The product appears in the admin list with correct data', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    const spec = productSpec()
    await createProductViaUi(page, spec, categoryName)

    await page.goto('/admin/products')
    const row = page.getByRole('row', { name: new RegExp(spec.name) })
    await expect(row).toBeVisible({ timeout: 30000 })
    await expect(row).toContainText(GHS(100))
    await expect(row).toContainText('10')
    await expect(row).toContainText('Yes')
  })

  test('Q4: Editing a product persists the change to the database', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    const spec = productSpec()
    await createProductViaUi(page, spec, categoryName)
    await waitForProduct(env, spec.slug)

    await page.locator('#price').fill('125.50')
    await page.getByRole('button', { name: 'Update Product' }).click()
    await page.waitForURL(/\/admin\/products$/, { timeout: 60000 })

    await expect(page.getByRole('row', { name: new RegExp(spec.name) })).toContainText(
      GHS(125.5),
      { timeout: 30000 }
    )

    const db = await adminDbClient(env)
    const { data } = await db.from('products').select('price').eq('slug', spec.slug).single()
    expect(Number((data as { price: number }).price)).toBe(125.5)
  })

  test('Q5: A published product is listed on the storefront with correct data', async ({
    page,
    env,
  }) => {
    await loginAsAdmin(page, env)
    const spec = productSpec()
    await createProductViaUi(page, spec, categoryName)
    await waitForProduct(env, spec.slug)

    // Browse as an anonymous visitor.
    await page.context().clearCookies()
    await page.goto('/shop')
    const card = page.locator(`a[href="/shop/${spec.slug}"]`)
    await expect(card).toBeVisible({ timeout: 30000 })
    await expect(card).toContainText(spec.name)
    await expect(card).toContainText(GHS(100))

    // Product detail page.
    await card.click()
    await page.waitForURL(new RegExp(`/shop/${spec.slug}$`), { timeout: 30000 })
    await expect(page.getByRole('heading', { name: spec.name })).toBeVisible()
    // The PDP price uses the larger display style; related products (which may
    // share the price) use the smaller card style.
    await expect(page.locator('.text-2xl', { hasText: GHS(100) })).toBeVisible()
    await expect(page.getByText('In stock')).toBeVisible()
    await expect(page.getByText(spec.description)).toBeVisible()
  })

  test('Q6: Add to cart from the product page puts the item in the cart', async ({
    page,
    env,
  }) => {
    await loginAsAdmin(page, env)
    const spec = productSpec()
    await createProductViaUi(page, spec, categoryName)
    await waitForProduct(env, spec.slug)

    // Browse as an anonymous visitor.
    await page.context().clearCookies()
    await page.goto(`/shop/${spec.slug}`)
    const addBtn = page.getByRole('button', { name: /Add to Cart/ })
    await expect(addBtn).toBeVisible({ timeout: 30000 })
    await addBtn.click()

    await page.goto('/cart')
    await expect(page.getByText(spec.name)).toBeVisible({ timeout: 30000 })

    // The cart must survive a refresh.
    await page.reload()
    await expect(page.getByText(spec.name)).toBeVisible()
  })

  test('Q7: Unpublishing removes the product from the storefront', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    const spec = productSpec()
    await createProductViaUi(page, spec, categoryName)
    const db = await waitForProduct(env, spec.slug)

    await page.locator('#is_published').uncheck()
    await page.getByRole('button', { name: 'Update Product' }).click()
    await page.waitForURL(/\/admin\/products$/, { timeout: 60000 })

    await expect
      .poll(
        async () => {
          const { data } = await db
            .from('products')
            .select('is_published')
            .eq('slug', spec.slug)
            .single()
          return (data as { is_published: boolean } | null)?.is_published ?? null
        },
        { timeout: 30000, message: 'product was never unpublished' }
      )
      .toBe(false)

    // Anonymous storefront must no longer list it.
    await page.context().clearCookies()
    await page.goto('/shop')
    await expect(page.locator(`a[href="/shop/${spec.slug}"]`)).toHaveCount(0, { timeout: 30000 })

    // And the product page must 404.
    const res = await page.request.get(`/shop/${spec.slug}`)
    expect(res.status()).toBe(404)
  })

  test('Q8: Invalid product input is rejected with visible errors', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/products/new')

    const db = await adminDbClient(env)
    const { data: before } = await db.from('products').select('id').like('name', `${TEST_PREFIX}%`)

    // A whitespace-only name passes the browser's native `required` check but
    // must be rejected by the application's own trim-based validation.
    await page.locator('#name').fill('   ')
    await page.locator('#slug').fill(`playwright-test-invalid-${Date.now()}`)
    await page.locator('#price').fill('100')
    await page.locator('#stock_quantity').fill('5')
    await page.locator('#description').fill('Automated Playwright test product')
    await page.getByRole('button', { name: 'Create Product' }).click()

    await expect(page.getByText('Product name is required')).toBeVisible({ timeout: 15000 })
    // The form stays open so the admin can correct the input.
    await expect(page.getByRole('heading', { name: 'Add Product' })).toBeVisible()

    // A negative price is blocked by the field's own min constraint.
    await page.locator('#price').fill('-5')
    const priceInvalid = await page
      .locator('#price')
      .evaluate((el: HTMLInputElement) => !el.checkValidity())
    expect(priceInvalid).toBe(true)

    const { data: after } = await db.from('products').select('id').like('name', `${TEST_PREFIX}%`)
    expect((after ?? []).length).toBe((before ?? []).length)
  })

  test('Q9: Deleting a product removes it and its images', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    const spec = productSpec()
    await createProductViaUi(page, spec, categoryName)
    const db = await waitForProduct(env, spec.slug)
    const productId = page.url().split('/').pop() as string

    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Delete Product' }).click()

    await page.waitForURL(/\/admin\/products$/, { timeout: 60000 })
    await expect(page.getByRole('row', { name: new RegExp(spec.name) })).toHaveCount(0)

    const { data: productRow } = await db
      .from('products')
      .select('id')
      .eq('id', productId)
      .maybeSingle()
    expect(productRow).toBeNull()

    // The images must cascade with the product.
    const { data: imageRows } = await db
      .from('product_images')
      .select('id')
      .eq('product_id', productId)
    expect(imageRows).toHaveLength(0)
  })

  test('Q10: Card layout and homepage layout persist in specifications and render correctly', async ({
    page,
    env,
  }) => {
    await loginAsAdmin(page, env)
    const spec = productSpec()
    await page.goto('/admin/products/new')
    await page.locator('#name').fill(spec.name)
    await page.locator('#slug').fill(spec.slug)
    await page.locator('#price').fill(spec.price)
    await page.locator('#stock_quantity').fill(spec.stock)
    await page.locator('#description').fill(spec.description)
    await page.locator('#short_description').fill(spec.shortDescription)
    if (categoryName) {
      await page.locator('#category_id').selectOption({ label: categoryName })
    }
    await page.locator('#is_available').check()
    await page.locator('#is_published').check()
    await page.locator('#card_layout').selectOption('featured')
    await page.locator('#homepage_layout').selectOption('horizontal')
    await page.getByRole('button', { name: 'Create Product' }).click()

    await page.waitForURL(/\/admin\/products\/[0-9a-f-]{36}$/, { timeout: 60000 })

    const db = await adminDbClient(env)
    const { data, error } = await db
      .from('products')
      .select('specifications')
      .eq('slug', spec.slug)
      .single()

    expect(error).toBeNull()
    const specs = data?.specifications as Record<string, unknown> | null
    expect(specs?._card_layout).toBe('featured')
    expect(specs?._homepage_layout).toBe('horizontal')

    // Edit form must prefill the saved values.
    await page.reload()
    await expect(page.locator('#card_layout')).toHaveValue('featured')
    await expect(page.locator('#homepage_layout')).toHaveValue('horizontal')
  })
})
