'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ProductCardProps } from '@/components/products/product-card'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  name: string
  slug: string
  price: string
  compare_at_price: string | null
  stock_quantity: number
  is_published: boolean
  is_available: boolean
  product_images: Array<{
    image_url: string
    alt_text: string | null
    is_primary: boolean
    position: number
  }>
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
  }).format(price)
}

export function SearchModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProductCardProps[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const searchProducts = async () => {
      if (query.trim().length < 2) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('products')
          .select('*, product_images(*)')
          .eq('is_published', true)
          .ilike('name', `%${query}%`)
          .limit(10)

        if (error) {
          console.error('Search failed:', error)
          setResults([])
          return
        }

        const mapped = (data as unknown as Product[])?.map((p) => {
          const images = p.product_images || []
          const primaryImage = images.find((img) => img.is_primary)
          const sortedImages = [...images].sort((a, b) => a.position - b.position)
          const firstImage = sortedImages[0] || primaryImage
          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: Number(p.price),
            compareAtPrice: p.compare_at_price
              ? Number(p.compare_at_price)
              : null,
            isFeatured: false,
            isAvailable: p.is_available,
            stockQuantity: p.stock_quantity,
            imageUrl: firstImage?.image_url ?? null,
            imageAlt: firstImage?.alt_text ?? undefined,
          }
        }) ?? []

        setResults(mapped)
      } catch (err) {
        console.error('Search error:', err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(searchProducts, 300)
    return () => clearTimeout(timeoutId)
  }, [query])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-24">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center border-b border-gray-200 p-3">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="flex-1 border-none outline-none text-gray-900 placeholder-gray-500"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close search</span>
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-gray-500">
              Searching...
            </div>
          )}

          {!loading && query.trim().length < 2 && (
            <div className="p-4 text-center text-gray-500">
              Type at least 2 characters to search
            </div>
          )}

          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No products found for "{query}"
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="divide-y divide-gray-200">
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/shop/${product.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50"
                >
                  <div className="relative aspect-square h-16 w-16 overflow-hidden rounded bg-gray-100">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.imageAlt || product.name}
                        className="h-full w-full object-cover object-center"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <span className="text-xs">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="border-t border-gray-200 p-3 text-center">
            <Link
              href={`/shop?search=${encodeURIComponent(query)}`}
              onClick={onClose}
              className="text-sm font-medium text-[#1677FF] hover:underline"
            >
              View all results
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
