'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateOrderStatus, updatePaymentState } from '@/lib/actions/admin-mutations'
import type { Database } from '@/types/supabase'

type Order = Database['public']['Tables']['orders']['Row'] & {
  order_items: Database['public']['Tables']['order_items']['Row'][]
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
  }).format(price)
}

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const paymentStateOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
]

function PaymentStateBadge({ paymentState }: { paymentState: string }) {
  const labels: Record<string, string> = {
    pending: 'Pending',
    paid: 'Paid',
    failed: 'Failed',
    refunded: 'Refunded',
  }

  const styles: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    paid: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    refunded: 'bg-yellow-100 text-yellow-700',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[paymentState] || styles.pending}`}
    >
      {labels[paymentState] || paymentState}
    </span>
  )
}

export default function OrderDetail({ order }: { order: Order }) {
  const router = useRouter()
  const [status, setStatus] = useState(order.status)
  const [paymentState, setPaymentState] = useState(order.payment_state)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true)
    const result = await updateOrderStatus(order.id, newStatus)
    if (result.success) {
      setStatus(newStatus)
      router.refresh()
    }
    setIsUpdating(false)
  }

  const handlePaymentStateChange = async (newPaymentState: string) => {
    setIsUpdating(true)
    const result = await updatePaymentState(order.id, newPaymentState)
    if (result.success) {
      setPaymentState(newPaymentState)
      router.refresh()
    }
    setIsUpdating(false)
  }

  return (
    <div>
      <div className="mb-8 flex items-baseline justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Order #{order.id.slice(0, 8).toUpperCase()}
        </h1>
        <span className="text-sm text-gray-500">
          {new Date(order.created_at).toLocaleDateString('en-GH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </div>

     <div className="border border-gray-200 bg-gray-50 p-6 mb-8">
    <div className="flex flex-wrap gap-6">
      <div>
        <p className="text-sm text-gray-500">Status</p>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={isUpdating}
          className="mt-1 text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <p className="text-sm text-gray-500">Payment State</p>
        <div className="mt-1">
          <PaymentStateBadge paymentState={paymentState} />
        </div>
        <select
          value={paymentState}
          onChange={(e) => handlePaymentStateChange(e.target.value)}
          disabled={isUpdating}
          className="mt-1 text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
        >
          {paymentStateOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <p className="text-sm text-gray-500">Customer</p>
        <p className="font-medium text-gray-900">
          {order.profile_id ? 'Authenticated customer' : 'Guest'}
        </p>
      </div>
      <div>
        <p className="text-sm text-gray-500">Currency</p>
        <p className="font-medium text-gray-900">{order.currency}</p>
      </div>
    </div>
  </div>

      <div className="border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Product</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Unit Price</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Qty</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-3 px-4 text-gray-900">{item.product_name}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{formatPrice(Number(item.product_price))}</td>
                  <td className="py-3 px-4 text-center text-gray-600">{item.quantity}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{formatPrice(Number(item.total_price))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-900">
                <td colSpan={3} className="py-3 px-4 text-right font-medium text-gray-900">
                  Grand Total
                </td>
                <td className="py-3 px-4 text-right font-bold text-gray-900">
                  {formatPrice(Number(order.total))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {(order.shipping_address || order.phone) && (
         <div className="border border-gray-200 bg-gray-50 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h2>
          {order.shipping_address && (
            <p className="text-sm text-gray-600 mb-2">{order.shipping_address}</p>
          )}
          {order.city && (
            <p className="text-sm text-gray-600 mb-2">{order.city}</p>
          )}
          {order.phone && (
            <p className="text-sm text-gray-600">{order.phone}</p>
          )}
        </div>
      )}

      {order.delivery_location_name && (
        <div className="border border-gray-200 bg-gray-50 p-6 mt-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Delivery Information</h2>
          <p className="text-sm text-gray-900">{order.delivery_location_name}</p>
          {order.delivery_region && (
            <p className="text-sm text-gray-600">{order.delivery_region}</p>
          )}
          {order.delivery_city && (
            <p className="text-sm text-gray-600">{order.delivery_city}</p>
          )}
          {order.delivery_estimated && (
            <p className="text-sm text-gray-600">Estimated: {order.delivery_estimated}</p>
          )}
          <p className="text-sm font-medium text-gray-900 mt-1">Delivery Fee: {formatPrice(Number(order.delivery_fee || 0))}</p>
        </div>
      )}
    </div>
  )
}
