'use client'

import { useState } from 'react'
import { Container } from '@/components/layout/container'
import { Section } from '@/components/ui/section'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/cart/cart-context'
import { ShoppingBag, MapPin, Truck, Clock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/supabase'
import type { CustomerInfo } from '@/lib/actions/orders'

type DeliveryLocation = Database['public']['Tables']['delivery_locations']['Row']

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
  }).format(price)
}

interface FormErrors {
  fullName?: string
  phone?: string
  email?: string
  address?: string
  city?: string
}

interface PrefillData {
  fullName: string
  phone: string
  email: string
  address: string
  city: string
}

interface CheckoutPageProps {
  prefill: PrefillData
  deliveryLocations: DeliveryLocation[]
}

export default function CheckoutPage({
  prefill,
  deliveryLocations,
}: CheckoutPageProps) {
  const router = useRouter()
  const { items, itemCount, subtotal, clearCart } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [selectedLocationId, setSelectedLocationId] = useState<string>('')
  const [selectedLocationName, setSelectedLocationName] = useState<string>('')
  const [selectedDeliveryFee, setSelectedDeliveryFee] = useState<number>(0)
  const [selectedEstimated, setSelectedEstimated] = useState<string>('')

  const [formData, setFormData] = useState<CustomerInfo>({
    fullName: prefill.fullName || '',
    phone: prefill.phone || '',
    email: prefill.email || '',
    address: prefill.address || '',
    city: prefill.city || '',
    notes: '',
  })

  if (itemCount === 0) {
    return (
      <Section className="py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="flex flex-col items-center justify-center py-12">
            <ShoppingBag size={48} className="mb-4 text-gray-300" />
            <h1 className="text-2xl font-bold text-gray-900">Your cart is empty</h1>
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

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locId = e.target.value
    const loc = deliveryLocations.find((l) => l.id === locId)
    if (loc) {
      setSelectedLocationId(loc.id)
      setSelectedLocationName(loc.name)
      setSelectedDeliveryFee(Number(loc.delivery_fee))
      setSelectedEstimated(loc.estimated_delivery)
    } else {
      setSelectedLocationId('')
      setSelectedLocationName('')
      setSelectedDeliveryFee(0)
      setSelectedEstimated('')
    }
  }

  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Please enter your full name.'
    }

    if (formData.phone.trim().length < 7) {
      errors.phone = 'Please enter a valid phone number.'
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.'
    }

    if (formData.address.trim().length < 5) {
      errors.address = 'Please enter your shipping address.'
    }

    if (formData.city.trim().length < 2) {
      errors.city = 'Please enter your city.'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field: keyof CustomerInfo, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    if (submitError) {
      setSubmitError(null)
    }
  }

  const handleSubmit = async () => {
    setSubmitError(null)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/checkout/initiate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          customerInfo: {
            ...formData,
            deliveryLocationId: selectedLocationId || null,
          },
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setSubmitError(result.error || 'Failed to initialize payment. Please try again.')
        setIsSubmitting(false)
        return
      }

      if (response.ok && result.success) {
        clearCart()
        if (result.isMockPayment || !result.paymentLink) {
          router.push(`/order-success/${result.orderId}?token=${result.guestToken}`)
        } else {
          window.location.href = result.paymentLink
        }
        return
      }

      setSubmitError(result.error || 'Failed to process your order. Please try again.')
    } catch {
      setSubmitError('Failed to process your order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const deliveryFee = selectedDeliveryFee
  const totalPrice = subtotal + deliveryFee

  return (
    <Section className="py-8 sm:py-12 lg:py-16">
      <Container>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Checkout
        </h1>

         <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="mt-8 lg:grid lg:grid-cols-2 lg:gap-x-16">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Customer Information</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-900">
                  Full name
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
                  aria-invalid={!!formErrors.fullName}
                  aria-describedby={formErrors.fullName ? 'fullName-error' : undefined}
                />
                {formErrors.fullName && (
                  <p id="fullName-error" className="mt-1 text-sm text-red-600">
                    {formErrors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-900">
                  Phone number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
                  aria-invalid={!!formErrors.phone}
                  aria-describedby={formErrors.phone ? 'phone-error' : undefined}
                />
                {formErrors.phone && (
                  <p id="phone-error" className="mt-1 text-sm text-red-600">
                    {formErrors.phone}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
                  aria-invalid={!!formErrors.email}
                  aria-describedby={formErrors.email ? 'email-error' : undefined}
                />
                {formErrors.email && (
                  <p id="email-error" className="mt-1 text-sm text-red-600">
                    {formErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-900">
                  Shipping address
                </label>
                <textarea
                  id="address"
                  rows={3}
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 resize-y"
                  aria-invalid={!!formErrors.address}
                  aria-describedby={formErrors.address ? 'address-error' : undefined}
                />
                {formErrors.address && (
                  <p id="address-error" className="mt-1 text-sm text-red-600">
                    {formErrors.address}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-900">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
                  aria-invalid={!!formErrors.city}
                  aria-describedby={formErrors.city ? 'city-error' : undefined}
                />
                {formErrors.city && (
                  <p id="city-error" className="mt-1 text-sm text-red-600">
                    {formErrors.city}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-900">
                  Additional notes (optional)
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  maxLength={1000}
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 resize-y"
                  placeholder="Any special delivery instructions..."
                />
              </div>
            </div>
          </div>

          <div className="mt-12 lg:mt-0">
            <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>

            <div className="mt-4 border border-gray-200 bg-gray-50 p-4 sm:p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <MapPin size={16} />
                Delivery Location
              </h3>

              {deliveryLocations.length > 0 ? (
                <select
                  id="deliveryLocation"
                  value={selectedLocationId}
                  onChange={handleLocationChange}
                  className="w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
                >
                  <option value="">Select a location</option>
                  {deliveryLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} — {loc.region} / {loc.city}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
                  No delivery locations are currently available. Please contact us for delivery options.
                </div>
              )}

              {selectedLocationName && (
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Truck size={14} />
                    <span>Delivery to: <strong>{selectedLocationName}</strong></span>
                  </div>
                  {selectedEstimated && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock size={14} />
                      <span>Estimated delivery: {selectedEstimated}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 border-t border-gray-200 pt-4 space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({itemCount} items)</span>
                  <span className="text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className="text-gray-900">
                    {deliveryLocations.length > 0 && selectedLocationId
                      ? formatPrice(selectedDeliveryFee)
                      : '—'}
                  </span>
                </div>
              </div>

              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-lg font-medium text-gray-900">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <p className="mt-4 text-xs text-gray-500">
                Click "Place Order & Pay" to securely complete your payment via Flutterwave.
                Your order will be confirmed immediately after successful payment.
              </p>
            </div>

            {submitError && (
              <div className="mt-4 rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || deliveryLocations.length === 0 || !selectedLocationId}
              className="mt-6 w-full rounded-md border border-transparent bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Processing order...
                </span>
              ) : (
                'Place Order & Pay'
              )}
            </button>

            {deliveryLocations.length === 0 && (
              <p className="mt-3 text-center text-xs text-gray-500">
                No delivery locations available. Please contact us.
              </p>
            )}
            {deliveryLocations.length > 0 && !selectedLocationId && (
              <p className="mt-3 text-center text-xs text-gray-500">
                Select a delivery location to continue.
              </p>
            )}
          </div>
        </form>
      </Container>
    </Section>
  )
}
