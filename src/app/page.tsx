import { createClient } from '@/lib/supabase/server'
import { Container } from '@/components/layout/container'
import { Hero } from '@/components/sections/hero'
import { ServicesSection } from '@/components/sections/services'
import { BrandStatement } from '@/components/sections/brand-statement'
import { CategorySection } from '@/components/products/category-section'
import { ProductGrid } from '@/components/products/product-grid'
import { NewsletterSubscribe } from '@/components/sections/newsletter-subscribe'
import type { ProductCardProps } from '@/components/products/product-card'

interface ProductRow {
  id: string
  name: string
  slug: string
  price: string
  compare_at_price: string | null
  is_featured: boolean
  is_available: boolean
  stock_quantity: number
  is_published: boolean
  card_layout: string | null
  homepage_order: number | null
  specifications: Record<string, unknown> | null
  product_images: Array<{
    image_url: string
    alt_text: string | null
    is_primary: boolean
    position: number
  }> | null
}

interface CategoryRow {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
  display_order: number | null
  display_mode: string | null
}

function mapProductRow(p: ProductRow): ProductCardProps {
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
    compareAtPrice: p.compare_at_price ? Number(p.compare_at_price) : null,
    isFeatured: p.is_featured,
    isAvailable: p.is_available,
    stockQuantity: p.stock_quantity,
    imageUrl,
    imageAlt: imageAlt ?? undefined,
    specifications: p.specifications,
    homepageLayout: 'vertical',
    cardLayout: 'standard',
  }
}

async function getHomepageCategories(): Promise<CategoryRow[]> {
  const supabase = await createClient()
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, slug, description, is_active, display_order, display_mode')
    .eq('is_active', true)
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true })

  if (error) {
    console.error('Failed to fetch categories:', error)
    return []
  }

  return (categories ?? []) as CategoryRow[]
}

async function getCategoryProducts(categoryId: string): Promise<ProductCardProps[]> {
  const supabase = await createClient()
  const { data: products, error } = await supabase
    .from('products')
    .select('*, product_images(*)')
    .eq('is_published', true)
    .eq('is_available', true)
    .eq('category_id', categoryId)
    .in('homepage_section', ['hero', 'featured', 'all'])
    .order('homepage_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(8)

  if (error) {
    console.error('Failed to fetch category products:', error)
    return []
  }

  if (!products || products.length === 0) {
    return []
  }

  return (products as ProductRow[]).map(mapProductRow)
}

async function getFeaturedProducts(): Promise<ProductCardProps[]> {
  const supabase = await createClient()
  const { data: products, error } = await supabase
    .from('products')
    .select('*, product_images(*)')
    .eq('is_published', true)
    .eq('is_available', true)
    .in('homepage_section', ['hero', 'featured', 'all'])
    .order('homepage_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(8)

  if (error || !products || products.length === 0) {
    return []
  }

  return (products as ProductRow[]).map(mapProductRow)
}

async function HomepageContent() {
  const categories = await getHomepageCategories()
  const featuredProducts = await getFeaturedProducts()

  const categorySections = await Promise.all(
    categories.map(async (cat) => {
      const products = await getCategoryProducts(cat.id)
      if (products.length === 0) return null

      const displayMode = cat.display_mode === 'horizontal' ? 'horizontal' : 'grid'

      return (
        <CategorySection
          key={cat.id}
          categoryName={cat.name}
          categorySlug={cat.slug}
          displayMode={displayMode}
          products={products}
          title={cat.display_order === 0 ? cat.name.toUpperCase() : cat.name}
        />
      )
    })
  )

  const visibleSections = categorySections.filter((s) => s !== null)

  return (
    <>
      <section className="border-t border-gray-300/50 py-6 sm:py-8">
        <Container>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs text-gray-500">
            <span>Quality Products</span>
            <span>Smart Living</span>
            <span>Reliable Technology</span>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20 lg:py-24">
        <Container>
          {featuredProducts.length > 0 && visibleSections.length === 0 ? (
            <div className="mb-10 text-center">
              <h2 className="font-display text-2xl font-light text-[#0B1F33] sm:text-3xl">
                Selected Products
              </h2>
            </div>
          ) : null}

          {featuredProducts.length > 0 && visibleSections.length === 0 ? (
            <>
              <ProductGrid
                products={featuredProducts}
                columns="collection"
                cardLayout="standard"
                homepageLayout="vertical"
              />
              <div className="mt-10 text-center">
                <a
                  href="/shop"
                  className="text-sm font-light text-[#1677FF] hover:text-[#0B3D91] underline"
                >
                  View all products
                </a>
              </div>
            </>
          ) : null}

          {visibleSections.map((section, i) => (
            <div key={section.key} className="mb-16 lg:mb-24 last:mb-0">
              {section}
            </div>
          ))}

          {visibleSections.length === 0 && featuredProducts.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-gray-500 mb-4">
                Products will appear here once inventory is added.
              </p>
              <a
                href="/shop"
                className="text-sm font-light text-[#1677FF] hover:text-[#0B3D91] underline"
              >
                View all products
              </a>
            </div>
          ) : null}
        </Container>
      </section>
    </>
  )
}

export default async function HomePage() {
  return (
    <>
      <Hero />
      <HomepageContent />
      <ServicesSection />
      <BrandStatement />
      <NewsletterSubscribe />
    </>
  )
}
