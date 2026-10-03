import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface CategoryNavItem {
  id: string
  name: string
  slug: string
}

export interface CategoryNavProps {
  categories: CategoryNavItem[]
  activeSlug: string | null
  className?: string
}

export function CategoryNav({
  categories,
  activeSlug,
  className,
}: CategoryNavProps) {
  const isActive = (slug: string) =>
    activeSlug === slug ? 'text-[#1677FF] font-medium' : ''

  return (
    <nav
      className={cn(
        'mb-8 overflow-x-auto overflow-y-hidden',
        'border-b border-gray-200',
        className
      )}
      aria-label="Filter products by category"
    >
      <ul
        className={cn(
          'flex min-w-max items-center gap-4 py-2 text-sm font-medium whitespace-nowrap'
        )}
      >
        <li>
          <Link
            href="/shop"
            className={cn(
              'text-gray-700 transition-colors hover:text-[#1677FF]',
               isActive('')
            )}
          >
            All Products
          </Link>
        </li>
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              href={`/shop?category=${category.slug}`}
              className={cn(
                'text-gray-700 transition-colors hover:text-[#1677FF]',
                isActive(category.slug)
              )}
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
