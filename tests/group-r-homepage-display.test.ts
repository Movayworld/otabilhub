import { test, expect, loadEnv, type EnvVars } from './helpers/fixtures'
import { loginAsAdmin } from './helpers/auth'
import { adminDbClient } from './helpers/db'

const TEST_PREFIX = 'PLAYWRIGHT TEST HOMEPAGE'

test.describe.configure({ mode: 'serial' })

test.describe('Group R: Homepage Product Display', () => {
  let env: EnvVars
  let cleanProductIds: string[] = []
  let cleanCategoryIds: string[] = []

  test.beforeAll(async () => {
    env = loadEnv()
  })

  test.afterAll(async () => {
    const db = await adminDbClient(env)
    if (cleanProductIds.length > 0) {
      await db.from('product_images').delete().in('product_id', cleanProductIds)
      await db.from('products').delete().in('id', cleanProductIds)
    }
    if (cleanCategoryIds.length > 0) {
      await db.from('categories').delete().in('id', cleanCategoryIds)
    }
  })

  async function getCategoryIdBySlug(env: EnvVars, slug: string): Promise<string> {
    const db = await adminDbClient(env)
    const { data } = await db.from('categories').select('id').eq('slug', slug).single()
    if (!data) throw new Error(`Category with slug "${slug}" not found`)
    return (data as { id: string }).id
  }

  async function createProductViaAdmin(
    page: import('@playwright/test').Page,
    name: string,
    slug: string,
    opts?: { cardLayout?: string; homepageLayout?: string; categoryId?: string; featured?: boolean }
  ): Promise<string> {
    await page.goto('/admin/products/new')
    await page.locator('#name').fill(name)
    await page.locator('#slug').fill(slug)
    await page.locator('#price').fill('100')
    await page.locator('#stock_quantity').fill('10')
    await page.locator('#description').fill('Automated Playwright test product')
    await page.locator('#short_description').fill('Test product')
    await page.locator('#is_available').check()
    await page.locator('#is_published').check()

    if (opts?.categoryId) {
      await page.locator('#category_id').selectOption({ value: opts.categoryId })
    }
    if (opts?.featured) {
      await page.locator('#is_featured').check()
    }
    if (opts?.cardLayout) {
      await page.locator('#card_layout').selectOption(opts.cardLayout)
    }
    if (opts?.homepageLayout) {
      await page.locator('#homepage_layout').selectOption(opts.homepageLayout)
    }

    await page.getByRole('button', { name: 'Create Product' }).click()
    await page.waitForURL(/\/admin\/products\/[0-9a-f-]{36}$/, { timeout: 60000 })

    const productId = page.url().split('/').pop() as string
    cleanProductIds.push(productId)
    return productId
  }

  async function createCategoryViaAdmin(
    page: import('@playwright/test').Page,
    name: string,
    slug: string,
    displayMode: 'grid' | 'horizontal' = 'grid'
  ): Promise<string> {
    await page.goto('/admin/categories')
    await page.getByRole('button', { name: /New category|Create first category/ }).first().click()
    await page.locator('#name').fill(name)
    await page.locator('#slug').fill(slug)
    if (displayMode) {
      await page.locator('#display_mode').selectOption(displayMode)
    }
    await page.getByRole('button', { name: 'Create' }).click()
    await expect(
      page.getByTestId('category-row').filter({ hasText: name })
    ).toBeVisible({ timeout: 30000 })

    const db = await adminDbClient(env)
    const { data } = await db.from('categories').select('id').eq('slug', slug).single()
    const categoryId = (data as { id: string }).id
    cleanCategoryIds.push(categoryId)
    return categoryId
  }

  test('H1: Product in a category with GRID display mode appears on homepage as 2-column grid on mobile', async ({ page }) => {
    const stamp = Date.now()
    const lightingCategoryId = await getCategoryIdBySlug(env, 'lighting')
    const name = `${TEST_PREFIX} Grid Light ${stamp}`
    const slug = `playwright-test-hp-grid-light-${stamp}`

    await loginAsAdmin(page, env)
    await createProductViaAdmin(page, name, slug, { categoryId: lightingCategoryId, featured: true })

    const db = await adminDbClient(env)
    await expect
      .poll(
        async () => {
          const { data } = await db.from('products').select('homepage_section').eq('slug', slug).maybeSingle()
          return (data as { homepage_section: string } | null)?.homepage_section ?? null
        },
        { timeout: 30000, message: 'homepage_section was never set to all' }
      )
      .toBe('all')

    await page.context().clearCookies()
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    await expect(page.locator(`a[href="/shop/${slug}"]`)).toBeVisible({ timeout: 30000 })

    const section = page.locator('h2', { hasText: 'Lighting' }).locator('xpath=..').locator('..')
    const grid = section.locator('.grid.gap-4')
    await expect(grid).toBeVisible()
    const gridClass = await grid.getAttribute('class') || ''
    expect(gridClass).toMatch(/grid-cols-2/)
  })

  test('H2: Product in a category with HORIZONTAL display mode appears on homepage as carousel', async ({ page }) => {
    const stamp = Date.now()
    const switchesCategoryId = await getCategoryIdBySlug(env, 'switches-sockets')
    const name = `${TEST_PREFIX} Carousel Switch ${stamp}`
    const slug = `playwright-test-hp-carousel-${stamp}`

    await loginAsAdmin(page, env)
    await createProductViaAdmin(page, name, slug, { categoryId: switchesCategoryId, featured: true })

    const db = await adminDbClient(env)
    await expect
      .poll(
        async () => {
          const { data } = await db.from('products').select('homepage_section').eq('slug', slug).maybeSingle()
          return (data as { homepage_section: string } | null)?.homepage_section ?? null
        },
        { timeout: 30000 }
      )
      .toBe('all')

    await page.context().clearCookies()
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    await expect(page.locator(`a[href="/shop/${slug}"]`)).toBeVisible({ timeout: 30000 })

    const section = page.locator('h2', { hasText: 'Switches & Sockets' }).locator('xpath=..').locator('..')
    const rail = section.locator('[data-testid="product-rail"]')
    await expect(rail).toBeVisible()
  })

  test('H3: Homepage renders products as standard vertical cards (not compact horizontal)', async ({ page }) => {
    const stamp = Date.now()
    const lightingCategoryId = await getCategoryIdBySlug(env, 'lighting')
    const name = `${TEST_PREFIX} Card Check ${stamp}`
    const slug = `playwright-test-hp-card-${stamp}`

    await loginAsAdmin(page, env)
    await createProductViaAdmin(page, name, slug, {
      categoryId: lightingCategoryId,
      cardLayout: 'compact',
      homepageLayout: 'horizontal',
      featured: true,
    })

    await page.context().clearCookies()
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    const cardLink = page.locator(`a[href="/shop/${slug}"]`).first()
    await expect(cardLink).toBeVisible({ timeout: 30000 })

    const imgContainer = cardLink.locator('div').first()
    const classes = await imgContainer.getAttribute('class') || ''
    expect(classes).not.toMatch(/\bw-16\b/)
    expect(classes).toMatch(/aspect-\[4\/3\]|aspect-square/)
  })

  test('H4: Homepage uses 2-column grid on desktop for GRID categories', async ({ page }) => {
    const stamp = Date.now()
    const lightingCategoryId = await getCategoryIdBySlug(env, 'lighting')

    await loginAsAdmin(page, env)
    for (let i = 0; i < 3; i++) {
      await createProductViaAdmin(page, `${TEST_PREFIX} Grid ${i} ${stamp}`, `playwright-test-hp-grid-${i}-${stamp}`, {
        categoryId: lightingCategoryId,
        featured: true,
      })
    }

    const db = await adminDbClient(env)
    for (let i = 0; i < 3; i++) {
      const slug = `playwright-test-hp-grid-${i}-${stamp}`
      await expect
        .poll(
          async () => {
            const { data } = await db.from('products').select('homepage_section').eq('slug', slug).maybeSingle()
            return (data as { homepage_section: string } | null)?.homepage_section ?? null
          },
          { timeout: 30000 }
        )
        .toBe('all')
    }

    await page.context().clearCookies()
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')

    const section = page.locator('h2', { hasText: 'Lighting' }).locator('xpath=..').locator('..')
    const grid = section.locator('.grid.gap-4')
    const gridClass = await grid.getAttribute('class') || ''

    expect(gridClass).toMatch(/grid-cols-2/)
    expect(gridClass).toMatch(/md:grid-cols-3/)
    expect(gridClass).toMatch(/lg:grid-cols-4/)
  })

  test('H5: Non-featured product still appears on homepage via category section', async ({ page }) => {
    const stamp = Date.now()
    const lightingCategoryId = await getCategoryIdBySlug(env, 'lighting')
    const name = `${TEST_PREFIX} NonFeatured ${stamp}`
    const slug = `playwright-test-hp-nf-${stamp}`

    await loginAsAdmin(page, env)
    await createProductViaAdmin(page, name, slug, { categoryId: lightingCategoryId, featured: false })

    const db = await adminDbClient(env)
    await expect
      .poll(
        async () => {
          const { data } = await db.from('products').select('homepage_section, is_featured').eq('slug', slug).maybeSingle()
          return data ? (data as { homepage_section: string; is_featured: boolean }) : null
        },
        { timeout: 30000 }
      )
      .toEqual({ homepage_section: 'all', is_featured: false })

    await page.context().clearCookies()
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await expect(page.locator(`a[href="/shop/${slug}"]`)).toBeVisible({ timeout: 30000 })
  })

  test('H6: Product in a new GRID category with display_mode appears on homepage', async ({ page }) => {
    const stamp = Date.now()
    const categoryName = `${TEST_PREFIX} New Category ${stamp}`
    const categorySlug = `playwright-test-hp-cat-${stamp}`

    await loginAsAdmin(page, env)
    const categoryId = await createCategoryViaAdmin(page, categoryName, categorySlug, 'grid')

    const productName = `${TEST_PREFIX} In New Category ${stamp}`
    const productSlug = `playwright-test-hp-incat-${stamp}`
    await createProductViaAdmin(page, productName, productSlug, { categoryId, featured: true })

    const db = await adminDbClient(env)
    await expect
      .poll(
        async () => {
          const { data } = await db.from('products').select('homepage_section').eq('slug', productSlug).maybeSingle()
          return (data as { homepage_section: string } | null)?.homepage_section ?? null
        },
        { timeout: 30000 }
      )
      .toBe('all')

    await page.context().clearCookies()
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await expect(page.locator(`a[href="/shop/${productSlug}"]`)).toBeVisible({ timeout: 30000 })

    await page.goto(`/shop?category=${categorySlug}`)
    await expect(page.locator(`a[href="/shop/${productSlug}"]`)).toBeVisible({ timeout: 30000 })
  })

  test('H7: Product in HORIZONTAL category renders as standard vertical card on homepage carousel', async ({ page }) => {
    const stamp = Date.now()
    const switchesCategoryId = await getCategoryIdBySlug(env, 'switches-sockets')
    const name = `${TEST_PREFIX} Horizontal Card ${stamp}`
    const slug = `playwright-test-hp-horiz-${stamp}`

    await loginAsAdmin(page, env)
    await createProductViaAdmin(page, name, slug, {
      categoryId: switchesCategoryId,
      homepageLayout: 'horizontal',
      cardLayout: 'compact',
      featured: true,
    })

    await page.context().clearCookies()
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    const cardLink = page.locator(`a[href="/shop/${slug}"]`).first()
    await expect(cardLink).toBeVisible({ timeout: 30000 })

    const imgContainer = cardLink.locator('div').first()
    const classes = await imgContainer.getAttribute('class') || ''
    expect(classes).toMatch(/aspect-\[4\/3\]|aspect-square/)
    expect(classes).not.toMatch(/\bw-16\b/)
  })

  test('H8: HORIZONTAL mode category shows a scrollable product rail with View all link', async ({ page }) => {
    const stamp = Date.now()
    const switchesCategoryId = await getCategoryIdBySlug(env, 'switches-sockets')
    const productSlug = `playwright-test-hp-horiz-mode-${stamp}`

    await loginAsAdmin(page, env)
    await createProductViaAdmin(page, `${TEST_PREFIX} Horizontal Rail ${stamp}`, productSlug, {
      categoryId: switchesCategoryId,
      featured: true,
    })

    await page.context().clearCookies()
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    await expect(page.locator(`a[href="/shop/${productSlug}"]`)).toBeVisible({ timeout: 30000 })

    const section = page.locator('h2', { hasText: 'Switches & Sockets' }).locator('xpath=..').locator('..')
    await expect(section.locator('[data-testid="product-rail"]')).toBeVisible()
    await expect(section.locator('a[href="/shop?category=switches-sockets"]')).toBeVisible()
  })

  test('H9: GRID mode category shows a grid layout (not a scrollable rail)', async ({ page }) => {
    const stamp = Date.now()
    const lightingCategoryId = await getCategoryIdBySlug(env, 'lighting')
    const productSlug = `playwright-test-hp-grid-mode-${stamp}`

    await loginAsAdmin(page, env)
    await createProductViaAdmin(page, `${TEST_PREFIX} Grid Mode ${stamp}`, productSlug, {
      categoryId: lightingCategoryId,
      featured: true,
    })

    await page.context().clearCookies()
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    await expect(page.locator(`a[href="/shop/${productSlug}"]`)).toBeVisible({ timeout: 30000 })

    const section = page.locator('h2', { hasText: 'Lighting' }).locator('xpath=..').locator('..')
    await expect(section.locator('.grid.gap-4')).toBeVisible()
    await expect(section.locator('[data-testid="product-rail"]')).not.toBeVisible()
  })

  test('H10: Admin can set display_mode to horizontal when creating a category', async ({ page }) => {
    const stamp = Date.now()
    const name = `${TEST_PREFIX} Horiz Cat ${stamp}`
    const slug = `playwright-test-horiz-cat-${stamp}`

    await loginAsAdmin(page, env)
    const categoryId = await createCategoryViaAdmin(page, name, slug, 'horizontal')

    const db = await adminDbClient(env)
    const { data } = await db.from('categories').select('display_mode').eq('id', categoryId).single()
    expect((data as { display_mode: string }).display_mode).toBe('horizontal')
  })

  test('H11: Admin can change display_mode on category edit from grid to horizontal', async ({ page }) => {
    const stamp = Date.now()
    const name = `${TEST_PREFIX} Mode Toggle ${stamp}`
    const slug = `playwright-test-mode-toggle-${stamp}`

    await loginAsAdmin(page, env)
    const categoryId = await createCategoryViaAdmin(page, name, slug, 'grid')

    const db = await adminDbClient(env)
    let { data } = await db.from('categories').select('display_mode').eq('id', categoryId).single()
    expect((data as { display_mode: string }).display_mode).toBe('grid')

    await page.goto('/admin/categories')
    await page.getByTestId('category-row').filter({ hasText: name }).getByRole('button', { name: 'Edit' }).click()
    await page.locator('#display_mode').selectOption('horizontal')
    await page.getByRole('button', { name: 'Update' }).click()

    await expect(page.getByTestId('category-row').filter({ hasText: name })).toContainText('Swipe', { timeout: 15000 })

    const { data: updated } = await db.from('categories').select('display_mode').eq('id', categoryId).single()
    expect((updated as { display_mode: string }).display_mode).toBe('horizontal')
  })

  test('H12: Collection page shows 2-column grid on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/shop?category=electronics')

    const grid = page.locator('.grid.gap-4').first()
    await expect(grid).toBeVisible()
    const gridClass = await grid.getAttribute('class') || ''
    expect(gridClass).toMatch(/grid-cols-2/)
  })
})
