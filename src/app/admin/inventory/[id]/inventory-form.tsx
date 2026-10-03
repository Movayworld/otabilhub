'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { adjustStock, correctStock, markDamaged, restockProduct, StockActionType } from '@/lib/actions/admin-inventory'
import type { Database } from '@/types/supabase'

type Movement = Database['public']['Tables']['inventory_movements']['Row']

interface InventoryFormProps {
  productId: string
  productName: string
  currentStock: number
}

const ACTION_TYPES: { value: StockActionType; label: string; description: string }[] = [
  { value: 'RESTOCK', label: 'Restock', description: 'Add stock from incoming shipment' },
  { value: 'MANUAL_ADJUSTMENT', label: 'Manual Adjustment', description: 'Adjust stock count manually' },
  { value: 'CORRECTION', label: 'Correction', description: 'Correct a previous count' },
  { value: 'DAMAGED', label: 'Damaged', description: 'Mark damaged/defective units' },
]

export default function InventoryForm({ productId, productName, currentStock }: InventoryFormProps) {
  const router = useRouter()
  const [actionType, setActionType] = useState<StockActionType>('RESTOCK')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [newStock, setNewStock] = useState<number | null>(null)

  const selectedType = ACTION_TYPES.find((t: { value: StockActionType; label: string; description: string }) => t.value === actionType)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsSubmitting(true)

    const qty = parseInt(quantity, 10)
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid positive quantity.')
      setIsSubmitting(false)
      return
    }

    let result
    try {
      switch (actionType) {
        case 'RESTOCK':
          result = await restockProduct(productId, qty, reason, notes)
          break
        case 'MANUAL_ADJUSTMENT':
          result = await adjustStock(productId, qty, reason, notes)
          break
        case 'CORRECTION':
          result = await correctStock(productId, qty, reason, notes)
          break
        case 'DAMAGED':
          result = await markDamaged(productId, qty, reason, notes)
          break
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
      return
    }

    if (result && result.success) {
      setSuccess(true)
      setNewStock(result.newStock ?? null)
    } else if (result && result.error) {
      setError(result.error)
    }

    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div>
        <p className="text-sm font-medium text-gray-900 mb-1">Product</p>
        <p className="text-sm font-medium text-gray-900">{productName}</p>
        <p className="text-sm text-gray-500">Current stock: {currentStock}</p>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-900 mb-2">Action Type</p>
        <select
          value={actionType}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setActionType(e.target.value as StockActionType)}
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
        >
          {ACTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label} — {t.description}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-gray-900 mb-1">Quantity</label>
        <input
          id="quantity"
          type="number"
          min="1"
          required
          value={quantity}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(e.target.value)}
          placeholder={selectedType?.label === 'Damaged' ? 'e.g. 2' : 'e.g. 10'}
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
        />
        <p className="mt-1 text-xs text-gray-500">
          {selectedType?.label === 'Damaged'
            ? 'Units to mark as damaged (will be deducted from stock)'
            : 'Units to add to stock'}
        </p>
      </div>

      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-900 mb-1">Reason</label>
        <input
          id="reason"
          type="text"
          required
          value={reason}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReason(e.target.value)}
          placeholder={
            actionType === 'RESTOCK'
              ? 'e.g. New shipment received'
              : actionType === 'DAMAGED'
              ? 'e.g. Damaged during handling'
              : 'e.g. Inventory reconciliation'
          }
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-900 mb-1">Notes (optional)</label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
          placeholder="Additional details about this stock change..."
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 resize-y"
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-3">
          <p className="text-sm text-green-600">
            Stock updated successfully. New stock: <strong>{newStock}</strong>
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `${selectedType?.label} Stock`
          )}
        </Button>
      </div>
    </form>
  )
}
