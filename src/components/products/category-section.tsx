import type { ProductCardProps } from './product-card'
import { ProductGrid } from './product-grid'
import { HorizontalProductScroller } from './product-scroller'
import Link from 'next/link'

export interface CategorySectionProps {
  categoryName: string
  categorySlug: string
  displayMode: 'grid' | 'horizontal'
  products: ProductCardProps[]
  title?: string
  subtitle?: string
  maxMobileColumns?: 2 | 3
}

export function CategorySection({
  categoryName,
  categorySlug,
  displayMode = 'grid',
  products,
  title,
  subtitle,
  maxMobileColumns = 2,
}: CategorySectionProps) {
  const sectionTitle = title || categoryName
  const sectionSubtitle = subtitle || `Shop our ${categoryName.toLowerCase()} collection.`

  if (products.length === 0) {
    return null
  }

  if (displayMode === 'horizontal') {
    return (
      <HorizontalProductScroller
        products={products}
        title={sectionTitle}
        subtitle={sectionSubtitle}
        categorySlug={categorySlug}
      />
    )
  }

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-semibold text-[#0B1F33] sm:text-3xl">
          {sectionTitle}
        </h2>
        <Link
          href={`/shop?category=${categorySlug}`}
          className="text-sm font-medium text-[#1677FF] hover:text-[#0B3D91] underline"
        >
          View all
        </Link>
      </div>
      {sectionSubtitle && (
        <p className="mt-2 max-w-2xl text-sm text-gray-600">{sectionSubtitle}</p>
      )}
      <div className="mt-8 sm:mt-10">
        <ProductGrid
          products={products}
          columns="collection"
          cardLayout="standard"
          homepageLayout="vertical"
          className="w-full"
        />
      </div>
    </div>
  )
}
