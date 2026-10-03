import Link from 'next/link'
import { Package, ArrowRight, RefreshCw } from 'lucide-react'
import { getProductsWithStock } from '@/lib/queries/inventory'
import { getAdminUser } from '@/lib/supabase/admin'
import { AdminLayout } from '@/app/admin/components/admin-layout'
import type { Database } from '@/types/supabase'

type ProductWithStock = Database['public']['Tables']['products']['Row'] & {
  last_movement: Database['public']['Tables']['inventory_movements']['Row'] | null
  last_movement_date: string | null
}

function getStockStatus(stock: number): { label: string; color: string; bg: string } {
  if (stock === 0) return { label: 'Out of Stock', color: 'text-red-700', bg: 'bg-red-100' }
  if (stock <= 5) return { label: 'Low Stock', color: 'text-yellow-700', bg: 'bg-yellow-100' }
  return { label: 'In Stock', color: 'text-green-700', bg: 'bg-green-100' }
}

export default async function InventoryPage() {
  await getAdminUser()
  const products = await getProductsWithStock()

  return (
    <AdminLayout currentPath="/admin/inventory">
      <div>
        <div className="mb-6 flex items-baseline justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Inventory
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Track stock levels and view movement history for all products.
            </p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">No products found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Product</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Current Stock</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Last Movement</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Last Movement Date</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const status = getStockStatus(product.stock_quantity)
                  return (
                    <tr key={product.id} className="border-b border-gray-200">
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/inventory/${product.id}`}
                          className="font-medium text-gray-900 hover:text-green-600"
                        >
                          {product.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {product.stock_quantity}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {product.last_movement ? product.last_movement.movement_type : '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                        {product.last_movement_date
                          ? new Date(product.last_movement_date).toLocaleDateString('en-GH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/inventory/${product.id}`}
                          className="inline-flex items-center text-sm text-gray-500 hover:text-green-600"
                        >
                          View History
                          <ArrowRight size={14} className="ml-1" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
