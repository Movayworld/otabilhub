'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Trash2, ShoppingBag, Minus, Plus } from 'lucide-react'
import { Container } from '@/components/layout/container'
import { Section } from '@/components/ui/section'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/cart/cart-context'
import { cn } from '@/lib/utils'

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
  }).format(price)
}

function CartItemRow({
  item,
}: {
  item: {
    id: string
    productId: string
    name: string
    slug: string
    price: number
    quantity: number
    imageUrl: string | null
    imageAlt: string | null
    maxAvailable: number
  }
}) {
  const { increment, decrement, removeItem, updateQuantity } = useCart()

  const handleQuantityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (isNaN(value) || value < 1) {
      updateQuantity(item.id, 1)
    } else {
      updateQuantity(item.id, Math.min(value, item.maxAvailable))
    }
  }

  const itemTotal = item.price * item.quantity

  return (
    <div className="flex gap-4 py-6 sm:py-8 first:pt-0 last:border-0 last:pb-0">
      <div className="flex-shrink-0">
        <div className="relative h-20 w-20 overflow-hidden rounded-md bg-gray-100">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.imageAlt || item.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <ShoppingBag size={16} />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1">
        <div className="flex justify-between gap-4">
          <div>
            <Link
              href={`/shop/${item.slug}`}
              className="text-sm font-medium text-gray-900 hover:text-[#1677FF]"
            >
              {item.name}
            </Link>
            <p className="mt-1 text-sm text-gray-500">
              {formatPrice(item.price)} each
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {formatPrice(itemTotal)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => decrement(item.id)}
              disabled={item.quantity <= 1}
              className={cn(
                'inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
              )}
              aria-label={`Decrease ${item.name} quantity`}
            >
              <Minus size={12} />
            </button>

            <input
              type="number"
              min={1}
              max={item.maxAvailable}
              value={item.quantity}
              onChange={handleQuantityInput}
              className="w-10 text-center text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1677FF]"
              aria-label={`Quantity for ${item.name}`}
            />

            <button
              type="button"
              onClick={() => increment(item.id)}
              disabled={item.quantity >= item.maxAvailable}
              className={cn(
                'inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
              )}
              aria-label={`Increase ${item.name} quantity`}
            >
              <Plus size={12} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => removeItem(item.id)}
            className="text-sm text-gray-500 hover:text-gray-900"
            aria-label={`Remove ${item.name} from cart`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CartPage() {
  const { items, itemCount, subtotal, clearCart } = useCart()

  if (itemCount === 0) {
    return (
      <Section className="py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="flex flex-col items-center justify-center py-12">
            <ShoppingBag size={48} className="mb-4 text-gray-300" />
            <h1 className="text-2xl font-bold text-gray-900">
              Your cart is empty
            </h1>
            <p className="mt-2 text-gray-600">
              Browse our products and add items to get started.
            </p>
            <Link href="/shop" className="mt-6">
              <Button variant="primary">Continue Shopping</Button>
            </Link>
          </div>
        </Container>
      </Section>
    )
  }

  return (
    <Section className="py-8 sm:py-12 lg:py-16">
      <Container>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Cart
        </h1>

        <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-12 lg:grid-cols-12 lg:gap-x-16 xl:gap-x-24">
          <div className="lg:col-span-7">
            <div className="border-t border-gray-200">
              {items.map((item) => (
                <CartItemRow key={item.id} item={item} />
              ))}
            </div>

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={clearCart}
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                Clear cart
              </button>
              <Link href="/shop">
                <Button variant="ghost" size="sm">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 lg:mt-0">
            <div className="border border-gray-200 bg-gray-50 p-6">
              <h2 className="text-sm font-medium uppercase tracking-wider text-gray-900">
                Order Summary
              </h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({itemCount} items)</span>
                  <span className="text-gray-900">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-gray-900">Calculated at checkout</span>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-lg font-medium text-gray-900">
                  <span>Total</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Link href="/checkout" className="block">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                  >
                    Proceed to Checkout
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  )
}
