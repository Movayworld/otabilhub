import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ProductCard, type ProductCardProps, type CardLayout } from './product-card'

export interface ProductGridProps {
  products: ProductCardProps[]
  className?: string
  emptyState?: ReactNode
  title?: string
  subtitle?: string
  cardLayout?: CardLayout
  homepageLayout?: 'horizontal' | 'vertical'
  columns?: 'auto' | 'compact' | 'wide' | 'two' | 'three' | 'mobileTwo' | 'collection'
}

export function ProductGrid({
  products,
  className,
  emptyState,
  title,
  subtitle,
  cardLayout = 'standard',
  homepageLayout = 'vertical',
  columns = 'auto',
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="w-full text-center py-16">
        {emptyState ?? (
          <p className="text-gray-500">No products available yet.</p>
        )}
      </div>
    )
  }

  const columnClass = {
    auto: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    compact: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    wide: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    two: 'grid-cols-1 sm:grid-cols-2',
    three: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
    mobileTwo: 'grid-cols-2',
    collection: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }[columns]

  return (
    <div className={cn('w-full', className)}>
      {title && (
        <h2 className="text-2xl font-semibold text-[#0B1F33] sm:text-3xl">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="mt-2 max-w-2xl text-sm text-gray-600">{subtitle}</p>
      )}
      {title && <div className="mt-8 sm:mt-10" />}
      <div className={cn('grid gap-4', columnClass)}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            {...product}
            cardLayout={product.cardLayout || cardLayout}
            homepageLayout={product.homepageLayout || homepageLayout}
          />
        ))}
      </div>
    </div>
  )
}
