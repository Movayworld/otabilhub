import { test, expect, loadEnv, type EnvVars } from './helpers/fixtures'
import { loginAsAdmin } from './helpers/auth'
import { adminDbClient } from './helpers/db'

const TEST_PREFIX = 'PLAYWRIGHT TEST'

function newCategory() {
  const stamp = Date.now()
  return {
    name: `${TEST_PREFIX} Electronics ${stamp}`,
    slug: `playwright-test-electronics-${stamp}`,
    description: `${TEST_PREFIX} category description`,
  }
}

async function cleanupTestCategories() {
  const db = await adminDbClient(loadEnv())
  const { data } = await db.from('categories').select('id').like('name', `${TEST_PREFIX}%`)
  const ids = (data ?? []).map((r) => (r as { id: string }).id)
  if (ids.length > 0) await db.from('categories').delete().in('id', ids)
}

/** Polls until the category row exists in the database and returns it. */
async function waitForCategory(env: EnvVars, slug: string) {
  const db = await adminDbClient(env)
  await expect
    .poll(
      async () => {
        const { data } = await db
          .from('categories')
          .select('slug')
          .eq('slug', slug)
          .maybeSingle()
        return data ? (data.slug as string) : null
      },
      { timeout: 30000, message: `category "${slug}" was never created` }
    )
    .toBe(slug)
  return db
}

async function createCategoryViaUi(
  page: import('@playwright/test').Page,
  cat: ReturnType<typeof newCategory>
) {
  await page.goto('/admin/categories')
  await page.getByRole('button', { name: /New category|Create first category/ }).first().click()
  await expect(page.getByRole('heading', { name: 'New Category' })).toBeVisible()
  await page.locator('#name').fill(cat.name)
  await page.locator('#slug').fill(cat.slug)
  await page.locator('#description').fill(cat.description)
  await page.getByRole('button', { name: 'Create' }).click()
  // On success the form closes and the list is re-rendered.
  await expect(page.getByTestId('category-row').filter({ hasText: cat.name })).toBeVisible({
    timeout: 30000,
  })
}

// Category CRUD mutates shared state; run sequentially.
test.describe.configure({ mode: 'serial' })

test.describe('Group C: Categories Workflow', () => {
  test.beforeAll(cleanupTestCategories)
  test.afterAll(cleanupTestCategories)

  test('C1: Admin can view the categories page', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    await page.goto('/admin/categories')
    await expect(page.locator('h1')).toContainText('Categories')
    await expect(
      page.getByRole('button', { name: /New category|Create first category/ }).first()
    ).toBeVisible()
  })

  test('C2: Creating a category persists to the list and the database', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    const cat = newCategory()
    await createCategoryViaUi(page, cat)

    const row = page.getByTestId('category-row').filter({ hasText: cat.name })
    await expect(row).toContainText(`/${cat.slug}`)
    await expect(row).toContainText(cat.description)
    await expect(row).toContainText('Active')

    const db = await waitForCategory(env, cat.slug)
    const { data, error } = await db
      .from('categories')
      .select('name, slug, description, is_active')
      .eq('slug', cat.slug)
      .single()
    expect(error).toBeNull()
    const row_ = data as Record<string, string | boolean>
    expect(row_.name).toBe(cat.name)
    expect(row_.description).toBe(cat.description)
    expect(row_.is_active).toBe(true)

    // Persists after a full reload.
    await page.reload()
    await expect(page.getByTestId('category-row').filter({ hasText: cat.name })).toBeVisible()
  })

  test('C3: Editing a category prefills the form and persists changes', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    const cat = newCategory()
    await createCategoryViaUi(page, cat)

    const row = page.getByTestId('category-row').filter({ hasText: cat.name })
    await row.getByRole('button', { name: 'Edit' }).click()
    await expect(page.getByRole('heading', { name: 'Edit Category' })).toBeVisible()

    // Regression: the edit form must be prefilled.
    await expect(page.locator('#name')).toHaveValue(cat.name)
    await expect(page.locator('#slug')).toHaveValue(cat.slug)
    await expect(page.locator('#description')).toHaveValue(cat.description)

    const updatedName = `${cat.name} EDITED`
    await page.locator('#name').fill(updatedName)
    await page.getByRole('button', { name: 'Update' }).click()

    await expect(
      page.getByTestId('category-row').filter({ hasText: updatedName })
    ).toBeVisible({ timeout: 30000 })

    const db = await adminDbClient(env)
    const { data } = await db.from('categories').select('name').eq('slug', cat.slug).single()
    expect((data as { name: string }).name).toBe(updatedName)
  })

  test('C4: A category can be deactivated and reactivated', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    const cat = newCategory()
    await createCategoryViaUi(page, cat)

    const row = page.getByTestId('category-row').filter({ hasText: cat.name })
    await row.getByRole('button', { name: 'Edit' }).click()
    await page.locator('#is_active').uncheck()
    await page.getByRole('button', { name: 'Update' }).click()

    const inactiveRow = page.getByTestId('category-row').filter({ hasText: cat.name })
    await expect(inactiveRow).toContainText('Inactive', { timeout: 30000 })

    const db = await adminDbClient(env)
    const { data } = await db.from('categories').select('is_active').eq('slug', cat.slug).single()
    expect((data as { is_active: boolean }).is_active).toBe(false)

    // Reactivate.
    await inactiveRow.getByRole('button', { name: 'Edit' }).click()
    await page.locator('#is_active').check()
    await page.getByRole('button', { name: 'Update' }).click()
    await expect(
      page.getByTestId('category-row').filter({ hasText: cat.name })
    ).toContainText('Active', { timeout: 30000 })

    const { data: after } = await db
      .from('categories')
      .select('is_active')
      .eq('slug', cat.slug)
      .single()
    expect((after as { is_active: boolean }).is_active).toBe(true)
  })

  test('C5: Deleting a category removes it from the list and database', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    const cat = newCategory()
    await createCategoryViaUi(page, cat)
    await waitForCategory(env, cat.slug)

    page.once('dialog', (dialog) => dialog.accept())
    await page
      .getByTestId('category-row')
      .filter({ hasText: cat.name })
      .getByRole('button', { name: 'Delete' })
      .click()

    await expect(
      page.getByTestId('category-row').filter({ hasText: cat.name })
    ).toHaveCount(0, { timeout: 30000 })

    const db = await adminDbClient(env)
    const { data } = await db.from('categories').select('id').eq('slug', cat.slug).maybeSingle()
    expect(data).toBeNull()
  })

  test('C6: A duplicate slug is rejected with a visible error', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    const cat = newCategory()
    await createCategoryViaUi(page, cat)
    await waitForCategory(env, cat.slug)

    // Attempt to create a second category with the same slug.
    await page.getByRole('button', { name: /New category|Create first category/ }).first().click()
    await page.locator('#name').fill(`${cat.name} DUPLICATE`)
    await page.locator('#slug').fill(cat.slug)
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByText('Failed to create category. Please try again.')).toBeVisible({
      timeout: 30000,
    })
    // The form stays open so the admin can correct the slug.
    await expect(page.getByRole('heading', { name: 'New Category' })).toBeVisible()

    const db = await adminDbClient(env)
    const { data } = await db.from('categories').select('id').eq('slug', cat.slug)
    expect(data).toHaveLength(1)
  })

  test('C7: A created category is selectable on the product form', async ({ page, env }) => {
    await loginAsAdmin(page, env)
    const cat = newCategory()
    await createCategoryViaUi(page, cat)
    await waitForCategory(env, cat.slug)

    await page.goto('/admin/products/new')
    const option = page.locator('#category_id option', { hasText: cat.name })
    await expect(option).toHaveCount(1, { timeout: 30000 })
  })
})
