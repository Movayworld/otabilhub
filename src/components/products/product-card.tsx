import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Heart } from 'lucide-react'

export type CardLayout = 'standard' | 'featured' | 'compact' | 'minimal' | 'overlay' | 'horizontal-card'

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
  homepageLayout?: 'horizontal' | 'vertical'
  className?: string
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
  }).format(price)
}

function DiscountBadge({ discountPercent }: { discountPercent: number }) {
  return (
    <span className="absolute top-3 right-3 z-10 inline-flex items-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
      -{discountPercent}%
    </span>
  )
}

export function ProductCard({
  name,
  slug,
  price,
  compareAtPrice,
  isFeatured,
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

  // Compact layout: minimal card, no badges
  if (cardLayout === 'compact') {
    if (homepageLayout === 'horizontal') {
      return (
        <Link href={href} className={cn('group block', className)}>
          <div className="flex items-center gap-3">
            <div className="relative aspect-square w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
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
              <h3 className="text-sm font-medium text-[#0B1F33] group-hover:text-[#1677FF] transition-colors line-clamp-1">
                {name}
              </h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-sm font-medium text-[#0B1F33]">{formatPrice(price)}</span>
                {hasDiscount && (
                  <span className="text-xs text-gray-500 line-through">{formatPrice(compareAtPrice!)}</span>
                )}
              </div>
            </div>
          </div>
        </Link>
      )
    }
    return (
      <Link href={href} className={cn('group block', className)}>
        <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-100">
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
        </div>
        <div className="mt-2 space-y-1">
          <h3 className="text-sm font-medium text-[#0B1F33] group-hover:text-[#1677FF] transition-colors line-clamp-1">
            {name}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-[#0B1F33]">{formatPrice(price)}</span>
            {hasDiscount && (
              <span className="text-xs text-gray-500 line-through">{formatPrice(compareAtPrice!)}</span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  // Featured layout: larger card with badges
  if (cardLayout === 'featured') {
    if (homepageLayout === 'horizontal') {
      return (
        <Link href={href} className={cn('group block', className)}>
          <div className="flex items-start gap-4">
            <div className="relative aspect-[4/5] w-48 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 shadow-sm">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={imageAlt || name}
                  fill
                  sizes="192px"
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400">
                  <span className="text-xs">No image</span>
                </div>
              )}
              {hasDiscount && <DiscountBadge discountPercent={discountPercent} />}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-medium text-[#0B1F33] group-hover:text-[#1677FF] transition-colors line-clamp-1">
                {name}
              </h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-lg font-medium text-[#0B1F33]">{formatPrice(price)}</span>
                {hasDiscount && (
                  <span className="text-sm text-gray-500 line-through">{formatPrice(compareAtPrice!)}</span>
                )}
              </div>
              {stockQuantity === 0 && !isAvailable && (
                <span className="text-xs text-gray-500">Out of stock</span>
              )}
            </div>
          </div>
        </Link>
      )
    }
    return (
      <Link href={href} className={cn('group block', className)}>
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-gray-100 shadow-sm">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt || name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 25vw"
              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <span className="text-xs">No image</span>
            </div>
          )}
          {hasDiscount && <DiscountBadge discountPercent={discountPercent} />}
        </div>
        <div className="mt-4 space-y-1">
          <h3 className="text-lg font-medium text-[#0B1F33] group-hover:text-[#1677FF] transition-colors line-clamp-1">
            {name}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-medium text-[#0B1F33]">{formatPrice(price)}</span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">{formatPrice(compareAtPrice!)}</span>
            )}
          </div>
          {stockQuantity === 0 && !isAvailable && (
            <span className="text-xs text-gray-500">Out of stock</span>
          )}
        </div>
      </Link>
    )
  }

  // Minimal layout: text-only card, very compact
  if (cardLayout === 'minimal') {
    if (homepageLayout === 'horizontal') {
      return (
        <Link href={href} className={cn('group block', className)}>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <h3 className="text-sm font-medium text-[#0B1F33] group-hover:text-[#1677FF] transition-colors">
              {name}
            </h3>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-medium text-[#0B1F33]">{formatPrice(price)}</span>
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through">{formatPrice(compareAtPrice!)}</span>
              )}
            </div>
          </div>
        </Link>
      )
    }
    return (
      <Link href={href} className={cn('group block p-3 border border-gray-200 rounded-md hover:border-[#1677FF] transition-colors', className)}>
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-[#0B1F33] group-hover:text-[#1677FF] transition-colors line-clamp-1">
              {name}
            </h3>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-sm font-medium text-[#0B1F33]">{formatPrice(price)}</span>
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through">{formatPrice(compareAtPrice!)}</span>
              )}
            </div>
          </div>
          <div className="relative aspect-square w-12 flex-shrink-0 overflow-hidden rounded bg-gray-100 ml-3">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={imageAlt || name}
                fill
                sizes="48px"
                className="object-cover object-center"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-300">
                <span className="text-[8px]">No img</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    )
  }

  // Overlay layout: image with text overlay
  if (cardLayout === 'overlay') {
    return (
      <Link href={href} className={cn('group block relative', className)}>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-100 shadow-sm">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt || name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 25vw"
              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <span className="text-xs">No image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-4">
            <h3 className="text-lg font-medium text-white line-clamp-1">
              {name}
            </h3>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-medium text-white">{formatPrice(price)}</span>
              {hasDiscount && (
                <span className="text-sm text-gray-300 line-through">{formatPrice(compareAtPrice!)}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Horizontal card layout: side-by-side image and details
  if (cardLayout === 'horizontal-card') {
    return (
      <Link href={href} className={cn('group block', className)}>
        <div className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
          <div className="relative aspect-square w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
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
            <h3 className="text-sm font-medium text-[#0B1F33] group-hover:text-[#1677FF] transition-colors line-clamp-1">
              {name}
            </h3>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm font-medium text-[#0B1F33]">{formatPrice(price)}</span>
              {hasDiscount && (
                <span className="text-xs text-gray-500 line-through">{formatPrice(compareAtPrice!)}</span>
              )}
            </div>
            {stockQuantity === 0 && !isAvailable && (
              <span className="text-xs text-red-500">Out of stock</span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  // Standard layout (default)
  if (homepageLayout === 'horizontal') {
    return (
      <Link href={href} className={cn('group block', className)}>
        <div className="flex items-start gap-4">
          <div className="relative aspect-[4/3] w-48 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={imageAlt || name}
                fill
                sizes="192px"
                className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                <span className="text-xs">No image</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-light text-[#0B1F33] group-hover:text-[#1677FF] transition-colors line-clamp-1">
              {name}
            </h3>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm font-light text-[#0B1F33]">
                {formatPrice(price)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(compareAtPrice!)}
                </span>
              )}
            </div>
            {stockQuantity === 0 && !isAvailable && (
              <span className="text-xs text-gray-500">Out of stock</span>
            )}
          </div>
        </div>
      </Link>
    )
  }
  return (
    <Link href={href} className={cn('group block', className)}>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-gray-100">
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
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="text-sm font-light text-[#0B1F33] group-hover:text-[#1677FF] transition-colors line-clamp-1">
          {name}
        </h3>
        <div className="flex flex-col gap-1 mt-1">
          <span className="text-sm font-medium text-[#0B1F33]">
            {formatPrice(price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-500 line-through">
              {formatPrice(compareAtPrice!)}
            </span>
          )}
        </div>
        {stockQuantity === 0 && !isAvailable && (
          <span className="text-xs text-gray-500">Out of stock</span>
        )}
      </div>
    </Link>
  )
}
