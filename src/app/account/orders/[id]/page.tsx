import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getUserOrderById } from '@/lib/queries/orders'
import CancelOrderButton from '@/components/cancel-order-button'
import { AccountLayout } from '@/app/account/components/account-layout'
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

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }

  const styles: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-orange-100 text-orange-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.pending}`}
    >
      {labels[status] || status}
    </span>
  )
}

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
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[paymentState] || styles.pending}`}
    >
      {labels[paymentState] || paymentState}
    </span>
  )
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await getUserOrderById(id)

  if (!order) {
    notFound()
  }

  const orderItems = order.order_items || []
  const orderTotal = Number(order.total)
  const orderDate = new Date(order.created_at).toLocaleDateString('en-GH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const itemsSubtotal = orderItems.reduce(
    (sum, item) => sum + Number(item.total_price),
    0
  )

  return (
    <AccountLayout currentPath="/account/orders">
      <div>
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <Link href="/account/orders">
            <button className="text-sm font-medium text-[#1677FF] hover:text-[#0B3D91]">
              &larr; Back to all orders
            </button>
          </Link>
        </div>

        <div className="border border-gray-200 bg-gray-50 p-6 mb-8">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-gray-500">Order reference</p>
              <p className="font-medium text-gray-900">
                #{order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium text-gray-900">{orderDate}</p>
            </div>
             <div>
               <p className="text-sm text-gray-500">Status</p>
               <StatusBadge status={order.status} />
             </div>
             <div>
               <p className="text-sm text-gray-500">Payment</p>
               <PaymentStateBadge paymentState={order.payment_state} />
             </div>
          </div>
        </div>

        <table className="w-full text-sm mb-8">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                Product
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-900">
                Price
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-900">
                Qty
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-900">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {orderItems.map((item) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-3 px-4">
                  <p className="font-medium text-gray-900">{item.product_name}</p>
                </td>
                <td className="py-3 px-4 text-right text-gray-600">
                  {formatPrice(Number(item.product_price))}
                </td>
                <td className="py-3 px-4 text-center text-gray-600">
                  {item.quantity}
                </td>
                <td className="py-3 px-4 text-right text-gray-600">
                  {formatPrice(Number(item.total_price))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-900">
              <td colSpan={3} className="py-3 px-4 text-right font-medium text-gray-900">
                Total
              </td>
              <td className="py-3 px-4 text-right font-bold text-gray-900">
                {formatPrice(orderTotal)}
              </td>
            </tr>
          </tfoot>
        </table>

        {(order.shipping_address || order.phone) && (
          <div className="border border-gray-200 bg-gray-50 p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Shipping information
            </h2>
          {order.shipping_address && (
            <p className="text-sm text-gray-600 mb-2">
              {order.shipping_address}
            </p>
          )}
          {order.city && (
            <p className="text-sm text-gray-600 mb-2">
              {order.city}
            </p>
          )}
          {order.phone && (
            <p className="text-sm text-gray-600">{order.phone}</p>
          )}
          </div>
        )}

        {order.delivery_location_name && (
          <div className="border border-gray-200 bg-gray-50 p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Delivery information
            </h2>
            <p className="text-sm text-gray-900">{order.delivery_location_name}</p>
            {order.delivery_region && (
              <p className="text-sm text-gray-600">{order.delivery_region}</p>
            )}
            {order.delivery_city && (
              <p className="text-sm text-gray-600">{order.delivery_city}</p>
            )}
            {order.delivery_estimated && (
              <p className="text-sm text-gray-600">Estimated delivery: {order.delivery_estimated}</p>
            )}
            <p className="text-sm font-medium text-gray-900 mt-1">Delivery fee: {formatPrice(Number(order.delivery_fee || 0))}</p>
          </div>
        )}

        {order.notes && (
          <div className="border border-gray-200 bg-gray-50 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Notes</h2>
            <p className="text-sm text-gray-600">{order.notes}</p>
          </div>
        )}

        {order.status !== 'completed' && order.status !== 'cancelled' && (
          <CancelOrderButton orderId={order.id} />
        )}
      </div>
    </AccountLayout>
  )
}
