import { test, expect, loadEnv, type EnvVars } from './helpers/fixtures'
import { loginAsAdmin } from './helpers/auth'
import { adminDbClient } from './helpers/db'

const TEST_PREFIX = 'PLAYWRIGHT TEST'
const FEEDBACK = 'Delivery location saved successfully.'

function testLocation() {
  return {
    name: `${TEST_PREFIX} Delivery ${Date.now()}`,
    region: 'Greater Accra',
    city: 'Accra',
    fee: '25',
    estimated: '2 days',
  }
}

async function seedCart(page: import('@playwright/test').Page) {
  // The checkout page only renders delivery options when the cart is not
  // empty, so seed a cart entry (never submitted in this suite).
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'otabilhub-cart',
      JSON.stringify([
        {
          id: 'seed-1',
          productId: '00000000-0000-0000-0000-00000000e2e1',
          name: 'Cart Seed',
          slug: 'cart-seed',
          price: 10,
          quantity: 1,
          imageUrl: null,
          imageAlt: null,
          maxAvailable: 10,
        },
      ])
    )
  })
}

async function fillLocationForm(
  page: import('@playwright/test').Page,
  loc: ReturnType<typeof testLocation>
) {
  await page.locator('#name').fill(loc.name)
  await page.locator('#region').fill(loc.region)
  await page.locator('#city').fill(loc.city)
  await page.locator('#delivery_fee').fill(loc.fee)
  await page.locator('#estimated_delivery').fill(loc.estimated)
}

/** Polls the DB until the named delivery location exists and returns its row. */
async function waitForDeliveryRow(env: EnvVars, name: string) {
  const db = await adminDbClient(env)
  await expect
    .poll(
      async () => {
        const { data } = await db
          .from('delivery_locations')
          .select('name')
          .eq('name', name)
          .maybeSingle()
        return data ? (data.name as string) : null
      },
      { timeout: 30000, message: `delivery location "${name}" was never created` }
    )
    .toBe(name)
  return db
}

async function cleanupTestLocations() {
  const db = await adminDbClient(loadEnv())
  const { data } = await db
    .from('delivery_locations')
    .select('id')
    .like('name', `${TEST_PREFIX}%`)
  const ids = (data ?? []).map((r) => (r as { id: string }).id)
  if (ids.length > 0) await db.from('delivery_locations').delete().in('id', ids)
}

// Delivery CRUD mutates shared state; run sequentially.
test.describe.configure({ mode: 'serial' })

test.describe('Group B: Delivery Workflow', () => {
  test.beforeAll(cleanupTestLocations)
  test.afterAll(cleanupTestLocations)

  test('B1: Admin can view delivery locations page', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/delivery')
    await expect(page.locator('h1')).toContainText('Delivery Locations')
    await expect(page.getByRole('button', { name: 'Add Location' }).first()).toBeVisible()
  })

  test('B2: Create delivery location persists to DB and admin table', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/delivery')

    const loc = testLocation()
    await page.getByRole('button', { name: 'Add Location' }).first().click()
    await expect(page.getByRole('heading', { name: 'New Location' })).toBeVisible()

    await fillLocationForm(page, loc)
    await page.locator('form').getByRole('button', { name: 'Add Location' }).click()

    await expect(page.getByText(FEEDBACK)).toBeVisible({ timeout: 30000 })
    await expect(
      page.getByText('Failed to create delivery location')
    ).toHaveCount(0)

    // Row appears immediately in the admin table.
    await expect(page.getByRole('cell', { name: loc.name })).toBeVisible()

    // Database consistency.
    const db = await adminDbClient(env)
    const { data, error } = await db
      .from('delivery_locations')
      .select('name, region, city, delivery_fee, estimated_delivery, is_active')
      .eq('name', loc.name)
      .single()
    expect(error).toBeNull()
    const row = data as Record<string, string | number | boolean>
    expect(row.region).toBe(loc.region)
    expect(row.city).toBe(loc.city)
    expect(Number(row.delivery_fee)).toBe(Number(loc.fee))
    expect(row.estimated_delivery).toBe(loc.estimated)
    expect(row.is_active).toBe(true)

    // Persists after a full reload.
    await page.reload()
    await expect(page.getByRole('cell', { name: loc.name })).toBeVisible()
    await expect(page.getByRole('row', { name: new RegExp(loc.name) })).toContainText('GHS 25.00')
  })

  test('B3: Editing a location prefills the form and persists changes', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/delivery')

    const loc = testLocation()
    await page.getByRole('button', { name: 'Add Location' }).first().click()
    await fillLocationForm(page, loc)
    await page.locator('form').getByRole('button', { name: 'Add Location' }).click()
    await expect(page.getByText(FEEDBACK)).toBeVisible({ timeout: 30000 })
    await waitForDeliveryRow(env, loc.name)

    await page.getByRole('row', { name: new RegExp(loc.name) }).getByTitle('Edit').click()
    await expect(page.getByRole('heading', { name: 'Edit Location' })).toBeVisible()

    // Regression: the edit form must be prefilled with the existing values.
    await expect(page.locator('#name')).toHaveValue(loc.name)
    await expect(page.locator('#region')).toHaveValue(loc.region)
    await expect(page.locator('#city')).toHaveValue(loc.city)
    await expect(page.locator('#delivery_fee')).toHaveValue(loc.fee)
    await expect(page.locator('#estimated_delivery')).toHaveValue(loc.estimated)

    await page.locator('#delivery_fee').fill('40')
    await page.locator('form').getByRole('button', { name: 'Update Location' }).click()
    await expect(page.getByText(FEEDBACK)).toBeVisible({ timeout: 30000 })

    await expect(page.getByRole('row', { name: new RegExp(loc.name) })).toContainText('GHS 40.00')

    const db = await adminDbClient(env)
    const { data } = await db
      .from('delivery_locations')
      .select('delivery_fee')
      .eq('name', loc.name)
      .single()
    expect(Number((data as { delivery_fee: number }).delivery_fee)).toBe(40)
  })

  test('B4: Deactivated locations disappear from public checkout', async ({ page, env }) => {
    await seedCart(page)
    await loginAsAdmin(page, env)
    await page.goto('/admin/delivery')

    const loc = testLocation()
    await page.getByRole('button', { name: 'Add Location' }).first().click()
    await fillLocationForm(page, loc)
    await page.locator('form').getByRole('button', { name: 'Add Location' }).click()
    await expect(page.getByText(FEEDBACK)).toBeVisible({ timeout: 30000 })

    // Active location is offered at checkout.
    await page.goto('/checkout')
    const select = page.locator('#deliveryLocation')
    await expect(select).toBeVisible()
    await expect(select.locator('option', { hasText: loc.name })).toHaveCount(1)

    // Deactivate it.
    await page.goto('/admin/delivery')
    await page.getByRole('row', { name: new RegExp(loc.name) }).getByTitle('Deactivate').click()
    await expect(
      page.getByRole('row', { name: new RegExp(loc.name) })
    ).toContainText('Inactive', { timeout: 30000 })
    await expect(page.getByText('Delivery location deactivated.')).toBeVisible({ timeout: 30000 })

    const db = await adminDbClient(env)
    const { data } = await db
      .from('delivery_locations')
      .select('is_active')
      .eq('name', loc.name)
      .single()
    expect((data as { is_active: boolean }).is_active).toBe(false)

    // Public checkout no longer offers it.
    await page.goto('/checkout')
    await expect(
      page.locator('#deliveryLocation').locator('option', { hasText: loc.name })
    ).toHaveCount(0)
  })

  test('B5: Reactivated locations are offered at checkout again', async ({ page, env }) => {
    await seedCart(page)
    await loginAsAdmin(page, env)
    await page.goto('/admin/delivery')

    const loc = testLocation()
    await page.getByRole('button', { name: 'Add Location' }).first().click()
    await fillLocationForm(page, loc)
    await page.locator('form').getByRole('button', { name: 'Add Location' }).click()
    await expect(page.getByText(FEEDBACK)).toBeVisible({ timeout: 30000 })
    await waitForDeliveryRow(env, loc.name)

    const row = page.getByRole('row', { name: new RegExp(loc.name) })
    await row.getByTitle('Deactivate').click()
    await expect(row).toContainText('Inactive', { timeout: 30000 })
    await row.getByTitle('Activate').click()
    await expect(row).toContainText('Active', { timeout: 30000 })

    const db = await adminDbClient(env)
    const { data } = await db
      .from('delivery_locations')
      .select('is_active')
      .eq('name', loc.name)
      .single()
    expect((data as { is_active: boolean }).is_active).toBe(true)

    await page.goto('/checkout')
    await expect(
      page.locator('#deliveryLocation').locator('option', { hasText: loc.name })
    ).toHaveCount(1)
  })

  test('B6: Deleting a location removes it from admin and DB', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/delivery')

    const loc = testLocation()
    await page.getByRole('button', { name: 'Add Location' }).first().click()
    await fillLocationForm(page, loc)
    await page.locator('form').getByRole('button', { name: 'Add Location' }).click()
    await expect(page.getByText(FEEDBACK)).toBeVisible({ timeout: 30000 })
    await waitForDeliveryRow(env, loc.name)

    await page.getByRole('row', { name: new RegExp(loc.name) }).getByTitle('Delete').click()
    await expect(page.getByText('Delivery location deleted.')).toBeVisible({ timeout: 30000 })
    await expect(page.getByRole('cell', { name: loc.name })).toHaveCount(0)

    const db = await adminDbClient(env)
    const { data } = await db
      .from('delivery_locations')
      .select('id')
      .eq('name', loc.name)
      .maybeSingle()
    expect(data).toBeNull()
  })

  test('B7: Whitespace-only required fields are rejected and nothing is stored', async ({
    page,
    env,
  }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/delivery')

    const db = await adminDbClient(env)
    const countRows = async () => {
      const { data } = await db
        .from('delivery_locations')
        .select('id')
        .like('name', `${TEST_PREFIX}%`)
      return (data ?? []).length
    }
    const before = await countRows()

    // A whitespace-only name passes the browser's native `required` check but
    // must be rejected by the application's own trim-based validation.
    await page.getByRole('button', { name: 'Add Location' }).first().click()
    await page.locator('#name').fill('   ')
    await page.locator('#region').fill('Greater Accra')
    await page.locator('#city').fill('Accra')
    await page.locator('#delivery_fee').fill('25')
    await page.locator('#estimated_delivery').fill('2 days')
    await page.locator('form').getByRole('button', { name: 'Add Location' }).click()

    await expect(page.getByText('Location name is required.')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(FEEDBACK)).toHaveCount(0)
    // The form must stay open so the admin can correct it.
    await expect(page.getByRole('heading', { name: 'New Location' })).toBeVisible()
    expect(await countRows()).toBe(before)

    // Same for estimated delivery.
    await page.locator('#name').fill(`${TEST_PREFIX} Incomplete`)
    await page.locator('#estimated_delivery').fill('   ')
    await page.locator('form').getByRole('button', { name: 'Add Location' }).click()
    await expect(page.getByText('Estimated delivery is required.')).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByText(FEEDBACK)).toHaveCount(0)
    expect(await countRows()).toBe(before)

    // A negative fee is blocked by the field's min constraint.
    await page.locator('#estimated_delivery').fill('2 days')
    await page.locator('#delivery_fee').fill('-5')
    const feeInvalid = await page
      .locator('#delivery_fee')
      .evaluate((el: HTMLInputElement) => !el.checkValidity())
    expect(feeInvalid).toBe(true)
    expect(await countRows()).toBe(before)
  })
})
