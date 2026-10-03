import { ArrowLeft, Package, Clock, BarChart3 } from 'lucide-react'
import { getProductWithMovements, getProductStock } from '@/lib/queries/inventory'
import { getProductById } from '@/lib/queries/admin'
import { getAdminUser } from '@/lib/supabase/admin'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/supabase'
import InventoryForm from './inventory-form'
import { AdminLayout } from '@/app/admin/components/admin-layout'

type MovementWithType = Database['public']['Tables']['inventory_movements']['Row'] & {
  profiles?: { full_name: string | null; email: string } | null
}

function getStockStatus(stock: number): { label: string; color: string; bg: string } {
  if (stock === 0) return { label: 'Out of Stock', color: 'text-red-700', bg: 'bg-red-100' }
  if (stock <= 5) return { label: 'Low Stock', color: 'text-yellow-700', bg: 'bg-yellow-100' }
  return { label: 'In Stock', color: 'text-green-700', bg: 'bg-green-100' }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-GH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function MovementRow({ movement }: { movement: MovementWithType }) {
  const sign = movement.quantity_change >= 0 ? '+' : ''
  return (
    <tr className="border-b border-gray-200">
      <td className="py-3 px-4 text-sm text-gray-500 whitespace-nowrap">{formatDateTime(movement.created_at)}</td>
      <td className="py-3 px-4">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
          {movement.movement_type}
        </span>
      </td>
      <td className={`py-3 px-4 text-sm font-medium ${movement.quantity_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {sign}{movement.quantity_change}
      </td>
      <td className="py-3 px-4 text-sm text-gray-900">{movement.quantity_before}</td>
      <td className="py-3 px-4 text-sm text-gray-900">{movement.quantity_after}</td>
      <td className="py-3 px-4 text-sm text-gray-600">{movement.reason || '—'}</td>
      <td className="py-3 px-4 text-sm text-gray-500">
        {movement.reference_type ? (
          <span className="font-mono text-xs">{movement.reference_type}</span>
        ) : (
          '—'
        )}
      </td>
      <td className="py-3 px-4 text-sm text-gray-500">
        {movement.notes || '—'}
      </td>
      <td className="py-3 px-4 text-sm text-gray-500">
        {movement.profiles?.email || movement.profiles?.full_name || '—'}
      </td>
    </tr>
  )
}

export default async function InventoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getAdminUser()
  if (!user) redirect('/admin/login')

  const { id } = await params
  const product = await getProductById(id)
  const stock = await getProductStock(id)
  const productWithMovements = await getProductWithMovements(id)

  if (!product) {
    return (
      <AdminLayout currentPath="/admin/inventory">
        <div className="py-12 text-center">
          <p className="text-gray-500">Product not found.</p>
          <Link href="/admin/inventory" className="text-green-600 hover:underline mt-4 inline-block">
            Back to inventory
          </Link>
        </div>
      </AdminLayout>
    )
  }

  const status = stock !== null ? getStockStatus(stock) : null
  const movements = productWithMovements?.movements ?? []

  return (
    <AdminLayout currentPath="/admin/inventory">
      <div>
      <div className="mb-8">
        <Link
          href="/admin/inventory"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={14} className="mr-1" />
          Back to inventory
        </Link>
        <div className="flex items-baseline justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{product.name}</h1>
          {status && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
              {status.label}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Current stock: <strong className="text-gray-900">{stock ?? '—'}</strong> units
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Package size={18} />
          Stock Actions
        </h2>
        <div className="border border-gray-200 bg-white p-6">
          <InventoryForm productId={product.id} productName={product.name} currentStock={stock ?? 0} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={18} />
          Movement History
          <span className="text-sm font-normal text-gray-500">({movements.length} entries)</span>
        </h2>

        {movements.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            No inventory movements recorded yet. Use the stock actions above to record changes.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Date/Time</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Change</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Before</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">After</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Reason</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Reference</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Notes</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <MovementRow key={movement.id} movement={movement} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </AdminLayout>
  )
}
