import { createClient } from '@/lib/supabase/server'
import { Container } from '@/components/layout/container'
import { Section } from '@/components/ui/section'
import { ProductGallery } from '@/components/products/product-gallery'
import { ProductInfo } from '@/components/products/product-info'
import { RelatedProducts } from '@/components/products/related-products'
import { notFound } from 'next/navigation'

interface ProductWithCategory {
  id: string
  name: string
  slug: string
  price: string
  compare_at_price: string | null
  stock_quantity: number
  is_available: boolean
  is_featured: boolean
  is_published: boolean
  short_description: string | null
  description: string | null
  specifications: Record<string, unknown> | null
  category: {
    id: string
    name: string
    slug: string
  } | null
  product_images: Array<{
    id: string
    image_url: string
    alt_text: string | null
    is_primary: boolean
    position: number
  }> | null
}

async function getProduct(slug: string): Promise<ProductWithCategory | null> {
  const supabase = await createClient()

  const { data: product, error } = await supabase
    .from('products')
    .select(
      `
      *,
      category:category_id(id, name, slug),
      product_images(*)
    `
    )
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Failed to fetch product:', error)
    return null
  }

  return product as unknown as ProductWithCategory
}

function getSortedImages(
  productImages: ProductWithCategory['product_images']
) {
  if (!productImages || productImages.length === 0) return []

  const primaryFirst = [...productImages].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return a.position - b.position
  })

  return primaryFirst.map((img) => ({
    id: img.id,
    url: img.image_url,
    alt: img.alt_text,
  }))
}

function buildProductInfo(product: ProductWithCategory) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: Number(product.price),
    compareAtPrice: product.compare_at_price
      ? Number(product.compare_at_price)
      : null,
    isAvailable: product.is_available,
    stockQuantity: product.stock_quantity,
    shortDescription: product.short_description,
    description: product.description,
    specifications: product.specifications,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        }
      : null,
    images: getSortedImages(product.product_images),
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    notFound()
  }

  const images = getSortedImages(product.product_images)
  const productInfo = buildProductInfo(product)

  return (
    <>
      <Section className="py-8 sm:py-12 lg:py-16">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <ProductGallery images={images} productName={product.name} />
            </div>

            <div>
              <ProductInfo product={productInfo} />
            </div>
          </div>
        </Container>
      </Section>

      {product.category?.slug && (
        <RelatedProducts
          categorySlug={product.category.slug}
          currentProductId={product.id}
          currentProductName={product.name}
        />
      )}
    </>
  )
}
