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
          <h2 className="font-display text-2xl font-light text-[#0B1F33] sm:text-3xl">
            {title}
          </h2>
          {categorySlug && (
            <Link
              href={`/shop?category=${categorySlug}`}
              className="text-sm font-light text-[#1677FF] hover:text-[#0B3D91] underline"
            >
              View all
            </Link>
          )}
        </div>
      )}
      {subtitle && (
        <p className="mt-2 max-w-2xl text-gray-600">{subtitle}</p>
      )}
      {title && <div className="mt-8 sm:mt-10" />}
      <div className="relative -mx-[30px] sm:mx-0">
        <div
          className="flex gap-4 pb-2 sm:pb-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent snap-x snap-mandatory sm:overflow-visible sm:flex-wrap sm:snap-none sm:static sm:mx-auto sm:overflow-x-hidden"
          data-testid="product-rail"
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-64 sm:w-56 snap-start"
            >
              <ProductCard
                {...product}
                cardLayout={product.cardLayout || cardLayout}
                homepageLayout="vertical"
              />
            </div>
          ))}
        </div>
        <div className="pointer-events-none sm:hidden absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent" />
      </div>
    </div>
  )
}
