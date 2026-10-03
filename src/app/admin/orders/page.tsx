import Link from 'next/link'
import { AdminLayout } from '@/app/admin/components/admin-layout'
import { getAdminOrders } from '@/lib/queries/admin'
import type { Database } from '@/types/supabase'

type Order = Database['public']['Tables']['orders']['Row']

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
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
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
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[paymentState] || styles.pending}`}>
      {labels[paymentState] || paymentState}
    </span>
  )
}

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders()

  return (
    <AdminLayout currentPath="/admin/orders">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">
          Orders
        </h1>

        {orders.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">No orders yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Order</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Customer</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Items</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Total</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Payment</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-200">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('en-GH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {order.profile_id ? 'Authenticated' : 'Guest'}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600">
                      {order.order_items ? (order.order_items as unknown as { length: number }).length : 0}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {formatPrice(Number(order.total))}
                    </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <PaymentStateBadge paymentState={order.payment_state} />
                      </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/admin/orders/${order.id}`}>
                        <span className="text-sm text-gray-600 hover:text-green-600">
                          View
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
