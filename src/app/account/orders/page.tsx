import Link from 'next/link'
import { AccountLayout } from '@/app/account/components/account-layout'
import { getUserOrders } from '@/lib/queries/orders'
import type { Database } from '@/types/supabase'
import { use } from 'react'

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
    completed: 'bg-[#E6F0FF] text-[#0B3D91]',
    cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}
    >
      {labels[status] || status}
    </span>
  )
}

function OrdersTable({ orders }: { orders: Order[] | null }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">You have no orders yet.</p>
        <Link href="/shop">
          <button className="px-4 py-2 text-sm font-medium text-white bg-[#1677FF] rounded-md hover:bg-[#0B3D91]">
            Start shopping
          </button>
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left py-3 px-4 font-medium text-gray-900">Order</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
            <th className="text-center py-3 px-4 font-medium text-gray-900">Items</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900">Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-gray-200">
              <td className="py-3 px-4">
                <Link
                  href={`/account/orders/${order.id}`}
                  className="font-medium text-gray-900 hover:text-[#1677FF]"
                >
                  #{order.id.slice(0, 8).toUpperCase()}
                </Link>
              </td>
              <td className="py-3 px-4 text-gray-600">
                {new Date(order.created_at).toLocaleDateString('en-GH', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </td>
              <td className="py-3 px-4 text-center text-gray-600">
                {order.order_items?.length || 0}
              </td>
              <td className="py-3 px-4">
                <StatusBadge status={order.status} />
              </td>
              <td className="py-3 px-4 text-right font-medium text-gray-900">
                {formatPrice(Number(order.total))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

async function OrdersTableLoader() {
  const orders = await getUserOrders()
  return <OrdersTable orders={orders} />
}

export default async function AccountOrdersPage() {
  const orders = await getUserOrders()
  return (
    <AccountLayout currentPath="/account/orders">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">
          My orders
        </h1>

        <OrdersTable orders={orders} />
      </div>
    </AccountLayout>
  )
}

