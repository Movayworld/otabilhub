import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export type CardLayout = 'standard' | 'featured' | 'compact' | 'minimal' | 'overlay' | 'horizontal-card'
export type HomepageLayout = 'horizontal' | 'vertical'

export interface ProductCardProps {
  id: string
  name: string
  slug: string
  price: number
  compareAtPrice?: number | null
  isFeatured?: boolean
  isAvailable?: boolean
  stockQuantity?: number
  imageUrl?: string | null
  imageAlt?: string
  specifications?: Record<string, unknown> | null
  cardLayout?: CardLayout
  homepageLayout?: HomepageLayout
  className?: string
}

function formatCedi(price: number): string {
  return `GH₵${price.toFixed(2)}`
}

function DiscountBadge({ discountPercent }: { discountPercent: number }) {
  return (
    <span
      className="absolute top-2 right-2 z-10 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-white"
      style={{ backgroundColor: '#1677FF' }}
    >
      -{discountPercent}%
    </span>
  )
}

export function ProductCard({
  id,
  name,
  slug,
  price,
  compareAtPrice,
  isAvailable = true,
  stockQuantity = 0,
  imageUrl,
  imageAlt = '',
  cardLayout = 'standard',
  homepageLayout = 'vertical',
  className,
}: ProductCardProps) {
  const href = `/shop/${slug}`

  const hasDiscount =
    compareAtPrice !== null &&
    compareAtPrice !== undefined &&
    compareAtPrice > price
  const discountPercent = hasDiscount
    ? Math.round(((compareAtPrice! - price) / compareAtPrice!) * 100)
    : 0
  const displayPrice = formatCedi(price)
  const displayCompareAt = hasDiscount ? formatCedi(compareAtPrice!) : null
  const inStock = isAvailable && stockQuantity > 0

  if (cardLayout === 'compact' || cardLayout === 'minimal' || cardLayout === 'horizontal-card') {
    return (
      <Link href={href} className={cn('group block', className)}>
        <div className="flex items-center gap-3">
          <div className="relative aspect-[4/3] w-16 flex-shrink-0 overflow-hidden rounded bg-gray-100">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={imageAlt || name}
                fill
                sizes="64px"
                className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                <span className="text-xs">No image</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-[#1677FF] transition-colors">
              {name}
            </h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-sm font-semibold text-gray-900">{displayPrice}</span>
              {displayCompareAt && (
                <span className="text-xs text-gray-500 line-through">{displayCompareAt}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    )
  }

  if (cardLayout === 'overlay') {
    return (
      <Link href={href} className={cn('group block relative', className)}>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt || name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 25vw"
              className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <span className="text-xs">No image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="text-lg font-semibold text-white line-clamp-1">{name}</h3>
            <p className="mt-1 text-lg font-semibold text-white">{displayPrice}</p>
            {displayCompareAt && (
              <p className="text-sm text-gray-300 line-through">{displayCompareAt}</p>
            )}
          </div>
        </div>
      </Link>
    )
  }

  if (cardLayout === 'featured') {
    return (
      <Link href={href} className={cn('group block', className)}>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt || name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 25vw"
              className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <span className="text-xs">No image</span>
            </div>
          )}
          {hasDiscount && <DiscountBadge discountPercent={discountPercent} />}
        </div>

        <div className="mt-3 flex flex-col gap-1.5">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-[#1677FF] transition-colors">
            {name}
          </h3>

          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold" style={{ color: '#0B1F33' }}>
              {displayPrice}
            </span>
            {displayCompareAt && (
              <span className="text-sm text-gray-500 line-through">{displayCompareAt}</span>
            )}
          </div>

          {!inStock && (
            <span className="text-xs text-gray-500">Out of stock</span>
          )}
        </div>
      </Link>
    )
  }

  if (homepageLayout === 'horizontal') {
    return (
      <Link href={href} className={cn('group block', className)}>
        <div className="flex items-center gap-4">
          <div className="relative aspect-[4/3] w-24 flex-shrink-0 overflow-hidden rounded bg-gray-100">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={imageAlt || name}
                fill
                sizes="96px"
                className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                <span className="text-xs">No image</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-[#1677FF] transition-colors">
              {name}
            </h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-sm font-semibold text-gray-900">{displayPrice}</span>
              {displayCompareAt && (
                <span className="text-xs text-gray-500 line-through">{displayCompareAt}</span>
              )}
            </div>
            {!inStock && (
              <span className="text-xs text-gray-500">Out of stock</span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={href} className={cn('group block', className)}>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt || name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 25vw"
            className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <span className="text-xs">No image</span>
          </div>
        )}
        {hasDiscount && <DiscountBadge discountPercent={discountPercent} />}
      </div>

      <div className="mt-2.5 flex flex-col gap-1.5">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-[#1677FF] transition-colors">
          {name}
        </h3>

        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold text-gray-900">{displayPrice}</span>
          {displayCompareAt && (
            <span className="text-sm text-gray-500 line-through">{displayCompareAt}</span>
          )}
        </div>

        {!inStock && (
          <span className="text-xs text-gray-500">Out of stock</span>
        )}
      </div>
    </Link>
  )
}
