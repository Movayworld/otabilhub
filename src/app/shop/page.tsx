import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Container } from '@/components/layout/container'
import { Section } from '@/components/ui/section'
import { CategoryNav, type CategoryNavItem } from '@/components/shop/category-nav'
import { SortSelector } from '@/components/shop/sort-selector'
import { ProductGrid } from '@/components/products/product-grid'
import type { ProductCardProps } from '@/components/products/product-card'

interface Product {
  id: string
  name: string
  slug: string
  price: string
  compare_at_price: string | null
  stock_quantity: number
  is_featured: boolean
  is_available: boolean
  product_images: Array<{
    image_url: string
    alt_text: string | null
    is_primary: boolean
    position: number
  }> | null
}

async function getCategories(): Promise<CategoryNavItem[]> {
  const supabase = await createClient()
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Failed to fetch categories:', error)
    return []
  }

  return (categories ?? []).map((c) => ({
    id: (c as { id: string }).id,
    name: (c as { name: string }).name,
    slug: (c as { slug: string }).slug,
  }))
}

async function getProducts(
  categorySlug: string | null,
  sortValue: string | null
): Promise<{
  products: ProductCardProps[]
  error: string | null
}> {
  const supabase = await createClient()

  const sortMap: Record<string, { column: string; ascending: boolean }[]> = {
    newest: [{ column: 'created_at', ascending: false }],
    'price-low': [{ column: 'price', ascending: true }],
    'price-high': [{ column: 'price', ascending: false }],
  }

  const orderClauses =
    sortMap[sortValue ?? ''] ?? [
      { column: 'is_featured', ascending: false },
      { column: 'created_at', ascending: false },
    ]

  let query = supabase.from('products').select('*, product_images(*)')

  if (categorySlug) {
    // Look up the category first: filtering directly on an embedded column is
    // not supported and silently returned no products.
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .maybeSingle()

    if (!category) {
      return { products: [], error: null }
    }
    query = query.eq('category_id', (category as { id: string }).id)
  }

  query = query.eq('is_published', true)

  orderClauses.forEach(({ column, ascending }) => {
    query = query.order(column, { ascending })
  })

  const { data: products, error } = await query

  if (error) {
    console.error('Failed to fetch products:', error)
    return { products: [], error: error.message }
  }

  if (!products || products.length === 0) {
    return { products: [], error: null }
  }

  return {
    products: products.map((product) => {
      const p = product as unknown as Product

      const images = p.product_images || []
      const primaryImage = images.find((img) => img.is_primary)
      const sortedImages = [...images].sort((a, b) => a.position - b.position)
      const firstImage = sortedImages[0] || primaryImage
      const imageUrl = firstImage?.image_url ?? null
      const imageAlt = firstImage?.alt_text ?? null

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      compareAtPrice: p.compare_at_price
        ? Number(p.compare_at_price)
        : null,
      isFeatured: p.is_featured,
      isAvailable: p.is_available,
      stockQuantity: p.stock_quantity,
      imageUrl,
      imageAlt: imageAlt ?? undefined,
      cardLayout: (((p as any).specifications as Record<string, unknown> | null)?._card_layout as 'standard' | 'featured' | 'compact') || 'standard',
      homepageLayout: (((p as any).specifications as Record<string, unknown> | null)?._homepage_layout as 'horizontal' | 'vertical') || 'vertical',
    }
    }),
    error: null,
  }
}

async function ShopContent({
  categorySlug,
  sortValue,
}: {
  categorySlug: string | null
  sortValue: string | null
}) {
  const [categories, productsResult] = await Promise.all([
    getCategories(),
    getProducts(categorySlug, sortValue),
  ])

  const { products, error } = productsResult

  if (error) {
    return (
      <Section className="py-12 sm:py-16 lg:py-20">
        <Container>
          <p className="text-center text-sm text-gray-500">
            Unable to load products. Please try again later.
          </p>
        </Container>
      </Section>
    )
  }

  const categoryLabel = categories.find((c) => c.slug === categorySlug)?.name

  return (
    <>
      <CategoryNav
        categories={categories}
        activeSlug={categorySlug}
        className="mb-8"
      />
      {categoryLabel && (
        <p className="mb-4 text-sm text-gray-600">
          Showing products in: {categoryLabel}
        </p>
      )}
      <SortSelector currentSort={sortValue} />
      <ProductGrid
        products={products}
        columns="collection"
        cardLayout="standard"
        homepageLayout="vertical"
        emptyState={
          <p className="text-sm text-gray-500">
            {categoryLabel
              ? `No products available in ${categoryLabel} yet.`
              : 'Products will appear here once inventory is added.'}
          </p>
        }
      />
    </>
  )
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>
}) {
  const params = await searchParams
  const categorySlug = params.category ?? null
  const sortValue = params.sort ?? null

  return (
    <Section className="py-8 sm:py-12 lg:py-16">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Shop
          </h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            Browse OtabilHub's selection of electronics, technology, and smart
            home products. Each item is carefully selected for quality and
            modern living.
          </p>
        </div>
        <Suspense fallback={null}>
          <ShopContent categorySlug={categorySlug} sortValue={sortValue} />
        </Suspense>
      </Container>
    </Section>
  )
}
