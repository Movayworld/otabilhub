import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ProductGrid } from '@/components/products/product-grid'
import type { ProductCardProps } from '@/components/products/product-card'
import { Section } from '@/components/ui/section'
import { Container } from '@/components/layout/container'

async function getRelatedProducts(
  categorySlug: string,
  currentProductId: string
): Promise<ProductCardProps[]> {
  const supabase = await createClient()

  // Look up the category first: filtering directly on an embedded column is
  // not supported here and silently broke this section.
  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .maybeSingle()

  if (!category) return []

  const { data: products, error } = await supabase
    .from('products')
    .select('*, product_images(*)')
    .eq('is_published', true)
    .eq('is_available', true)
    .eq('category_id', (category as { id: string }).id)
    .neq('id', currentProductId)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(4)

  if (error) {
    console.error('Failed to fetch related products:', error)
    return []
  }

  if (!products || products.length === 0) return []

  return products.map((product) => {
    const p = product as unknown as {
      id: string
      name: string
      slug: string
      price: string
      compare_at_price: string | null
      is_available: boolean
      stock_quantity: number
      is_featured: boolean
      product_images: Array<{
        image_url: string
        alt_text: string | null
        is_primary: boolean
        position: number
      }> | null
    }

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
    }
  })
}

export async function RelatedProducts({
  categorySlug,
  currentProductId,
  currentProductName,
}: {
  categorySlug: string
  currentProductId: string
  currentProductName: string
}) {
  const products = await getRelatedProducts(categorySlug, currentProductId)

  if (products.length === 0) return null

  return (
    <Section className="py-12 sm:py-16 lg:py-20">
      <Container>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          You may also like
        </h2>
        <ProductGrid
          products={products}
          className="mt-8"
          title={undefined}
          subtitle={undefined}
        />
      </Container>
    </Section>
  )
}
