'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import {
  createDeliveryLocation,
  updateDeliveryLocation,
} from '@/lib/actions/admin-delivery'
import type { Database } from '@/types/supabase'

type DeliveryLocation = Database['public']['Tables']['delivery_locations']['Row']

interface DeliveryFormProps {
  editingId: string | null
  initialData: DeliveryLocation | null
  onSuccess: () => void
  onCancel: () => void
}

export function DeliveryForm({ editingId, initialData, onSuccess, onCancel }: DeliveryFormProps) {
  const [name, setName] = useState(initialData?.name ?? '')
  const [region, setRegion] = useState(initialData?.region ?? '')
  const [city, setCity] = useState(initialData?.city ?? '')
  const [deliveryFee, setDeliveryFee] = useState(
    initialData?.delivery_fee !== undefined && initialData?.delivery_fee !== null
      ? String(initialData.delivery_fee)
      : ''
  )
  const [estimatedDelivery, setEstimatedDelivery] = useState(initialData?.estimated_delivery ?? '')
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Location name is required.')
      return
    }

    const fee = parseFloat(deliveryFee)
    if (isNaN(fee) || fee < 0) {
      setError('Please enter a valid delivery fee (0 or more).')
      return
    }

    if (!estimatedDelivery.trim()) {
      setError('Estimated delivery is required.')
      return
    }

    if (!region.trim()) {
      setError('Region is required.')
      return
    }

    if (!city.trim()) {
      setError('City is required.')
      return
    }

    setIsSubmitting(true)

    try {
      const data = {
        name: name.trim(),
        region: region.trim(),
        city: city.trim(),
        delivery_fee: fee,
        estimated_delivery: estimatedDelivery.trim(),
        is_active: isActive,
      } as DeliveryLocation & { id?: string }

      if (editingId) {
        const result = await updateDeliveryLocation(editingId, data)
        if (result.success) {
          onSuccess()
        } else {
          setError(result.error || 'Failed to update.')
        }
      } else {
        const result = await createDeliveryLocation(data)
        if (result.success) {
          onSuccess()
        } else {
          setError(result.error || 'Failed to create.')
        }
      }
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="name" className="block text-sm font-medium text-gray-900">
          Location Name *
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
        />
      </div>

      <div>
        <label htmlFor="region" className="block text-sm font-medium text-gray-900">
          Region *
        </label>
        <input
          type="text"
          id="region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          required
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
        />
      </div>

      <div>
        <label htmlFor="city" className="block text-sm font-medium text-gray-900">
          City *
        </label>
        <input
          type="text"
          id="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
        />
      </div>

      <div>
        <label htmlFor="delivery_fee" className="block text-sm font-medium text-gray-900">
          Delivery Fee (GHS) *
        </label>
        <input
          type="number"
          id="delivery_fee"
          value={deliveryFee}
          onChange={(e) => setDeliveryFee(e.target.value)}
          min={0}
          step={0.01}
          required
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
        />
      </div>

      <div>
        <label htmlFor="estimated_delivery" className="block text-sm font-medium text-gray-900">
          Estimated Delivery *
        </label>
        <input
          type="text"
          id="estimated_delivery"
          value={estimatedDelivery}
          onChange={(e) => setEstimatedDelivery(e.target.value)}
          required
          placeholder="e.g. Within 2 days"
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
        />
      </div>

      <div className="sm:col-span-2 flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-900">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-gray-300 text-green-600 focus:ring-green-600"
          />
          Active
        </label>
      </div>

      {error && (
        <div className="sm:col-span-2 rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="sm:col-span-2 flex items-center gap-3 pt-2">
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : editingId ? 'Update Location' : 'Add Location'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
