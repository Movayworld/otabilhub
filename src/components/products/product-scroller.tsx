import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ProductCard, type ProductCardProps, type CardLayout } from './product-card'
import Link from 'next/link'

export interface HorizontalProductScrollerProps {
  products: ProductCardProps[]
  className?: string
  emptyState?: ReactNode
  title?: string
  subtitle?: string
  cardLayout?: CardLayout
  categorySlug?: string
}

export function HorizontalProductScroller({
  products,
  className,
  emptyState,
  title,
  subtitle,
  cardLayout = 'standard',
  categorySlug,
}: HorizontalProductScrollerProps) {
  if (products.length === 0) {
    return (
      <div className="w-full text-center py-16">
        {emptyState ?? (
          <p className="text-gray-500">No products available yet.</p>
        )}
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      {title && (
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold text-[#0B1F33] sm:text-3xl">
            {title}
          </h2>
          {categorySlug && (
            <Link
              href={`/shop?category=${categorySlug}`}
              className="text-sm font-medium text-[#1677FF] hover:text-[#0B3D91] underline"
            >
              View all
            </Link>
          )}
        </div>
      )}
      {subtitle && (
        <p className="mt-2 max-w-2xl text-sm text-gray-600">{subtitle}</p>
      )}
      {title && <div className="mt-8 sm:mt-10" />}
      <div className="relative">
        <div
          className="flex gap-4 pb-2 sm:pb-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent snap-x snap-mandatory sm:overflow-visible sm:flex-wrap sm:snap-none sm:grid sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"
          data-testid="product-rail"
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-64 snap-start sm:w-full sm:flex-shrink-0 sm:basis-0"
            >
              <ProductCard
                {...product}
                cardLayout={product.cardLayout || cardLayout}
                homepageLayout="vertical"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
