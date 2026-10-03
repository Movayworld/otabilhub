import Link from 'next/link'
import { getUserOrders } from '@/lib/queries/orders'
import { AccountLayout } from '@/app/account/components/account-layout'
import { Button } from '@/components/ui/button'
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
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}
    >
      {labels[status] || status}
    </span>
  )
}

function RecentOrdersList({ orders }: { orders: Order[] | null }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">You have no orders yet.</p>
        <Link href="/shop">
          <Button variant="primary">Start shopping</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-900">Order</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
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
                  className="font-medium text-gray-900 hover:text-green-600"
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

async function RecentOrdersListLoader() {
  const orders = await getUserOrders()
  return <RecentOrdersList orders={orders} />
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const orders = await getUserOrders()

  return (
    <AccountLayout currentPath="/account">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Account
        </h1>

        {sp.logoutError && (
          <div className="mt-4 rounded-md bg-yellow-50 p-3">
            <p className="text-sm text-yellow-800">
              There was a problem logging out. Please try again.
            </p>
          </div>
        )}

        <div className="mt-8 space-y-8">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Recent orders</h2>
            <p className="text-sm text-gray-600 mb-4">
              View your recent orders and order history.
            </p>
            <RecentOrdersList orders={orders} />
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <Link href="/account/profile">
            <Button variant="secondary">Edit profile information</Button>
          </Link>
        </div>
      </div>
    </AccountLayout>
  )
}
