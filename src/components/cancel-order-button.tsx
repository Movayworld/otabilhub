'use client'

import { useState } from 'react'
import { cancelOrder } from '@/lib/actions/orders'
import { Button } from '@/components/ui/button'

interface CancelOrderButtonProps {
  orderId: string
  guestToken?: string | null
}

export default function CancelOrderButton({ orderId, guestToken }: CancelOrderButtonProps) {
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState(false)

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return
    }
    setIsCancelling(true)
    setError(null)
    try {
      const result = await cancelOrder(orderId, guestToken || undefined)
      if (result.success) {
        setCancelled(true)
        window.location.reload()
      } else {
        setError(result.error || 'Failed to cancel order.')
      }
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setIsCancelling(false)
    }
  }

  if (cancelled) {
    return (
      <div className="mt-4 p-4 border border-yellow-200 bg-yellow-50 rounded-md">
        <p className="text-sm text-yellow-800">This order has been cancelled.</p>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 hover:border-red-400" onClick={handleCancel} disabled={isCancelling}>
        {isCancelling ? 'Cancelling...' : 'Cancel Order'}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
