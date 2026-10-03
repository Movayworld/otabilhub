'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QuantitySelector } from '@/components/products/quantity-selector'
import { ProductSpecifications } from '@/components/products/product-specifications'
import { useCart } from '@/components/cart/cart-context'

export interface ProductInfoProps {
  product: {
    id: string
    name: string
    slug: string
    price: number
    compareAtPrice: number | null
    isAvailable: boolean
    stockQuantity: number
    shortDescription: string | null
    description: string | null
    specifications: Record<string, unknown> | null
    category: {
      id: string
      name: string
      slug: string
    } | null
    images: Array<{
      id: string
      url: string
      alt: string | null
    }>
  }
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
  }).format(price)
}

export function ProductInfo({ product }: ProductInfoProps) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)

  const hasDiscount =
    product.compareAtPrice !== null &&
    product.compareAtPrice !== undefined &&
    product.compareAtPrice > product.price

  const maxAvailable = product.isAvailable ? product.stockQuantity : 0

  useEffect(() => {
    if (!product.isAvailable) {
      setQuantity(0)
    }
  }, [product.isAvailable])

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(Math.max(1, Math.min(newQuantity, maxAvailable)))
  }

  const handleAddToCart = () => {
    const primaryImage = product.images.find((img) => img.url)
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      quantity,
      imageUrl: primaryImage?.url ?? null,
      imageAlt: primaryImage?.alt ?? null,
      maxAvailable,
    })
  }

  const displayQuantity = product.isAvailable ? quantity : 0

  return (
    <div className="w-full">
      {product.category && (
        <p className="text-sm font-medium uppercase tracking-wider text-gray-500">
          {product.category.name}
        </p>
      )}

      <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        {product.name}
      </h1>

      <div className="mt-4 flex items-baseline gap-3">
        <span className="text-2xl font-medium text-gray-900">
          {formatPrice(product.price)}
        </span>
        {hasDiscount && (
          <span className="text-lg text-gray-500 line-through">
            {formatPrice(product.compareAtPrice!)}
          </span>
        )}
      </div>

      <div className="mt-4">
        {product.isAvailable ? (
          <p className="text-sm text-gray-600">In stock</p>
        ) : (
          <p className="text-sm text-gray-500">Out of stock</p>
        )}
      </div>

      {product.shortDescription && (
        <p className="mt-4 max-w-prose text-gray-600">
          {product.shortDescription}
        </p>
      )}

      <div className="mt-6 space-y-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-900">Quantity:</span>
          <QuantitySelector
            quantity={displayQuantity}
            maxAvailable={maxAvailable}
            onChange={handleQuantityChange}
            available={product.isAvailable}
          />
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={handleAddToCart}
            disabled={!product.isAvailable}
            className="w-full sm:w-auto"
          >
            <ShoppingBag size={16} className="mr-2" />
            Add to Cart
          </Button>
          {!product.isAvailable && (
            <span className="text-sm text-gray-500">
              This product is currently unavailable
            </span>
          )}
        </div>
      </div>

      {product.specifications && (
        <ProductSpecifications specifications={product.specifications} />
      )}

      {product.description && (
        <div className="mt-8 border-t border-gray-200 pt-8">
          <h3 className="text-sm font-medium uppercase tracking-wider text-gray-900">
            Description
          </h3>
          <div
            className="mt-4 prose prose-sm max-w-none text-gray-600"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}

      {product.category && (
        <div className="mt-8 border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-600">
            Category:
            <Link
              href={`/shop?category=${product.category.slug}`}
              className="ml-1 text-gray-900 hover:text-green-600"
            >
              {product.category.name}
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
