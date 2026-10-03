import { getAdminProducts, getAllCategories } from '@/lib/queries/admin'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AdminLayout } from '@/app/admin/components/admin-layout'

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
  }).format(price)
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-orange-100 text-orange-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  return styles[status] || styles.pending
}

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    getAdminProducts(),
    getAllCategories(),
  ])

  return (
    <AdminLayout currentPath="/admin/products">
      <div>
        <div className="mb-6 flex items-baseline justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Products
          </h1>
          <Link href="/admin/products/new">
            <Button variant="primary" size="sm">
              Add product
            </Button>
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">No products yet. Create your first product.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Price</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Stock</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Published</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const primaryImage = product.product_images.find(img => img.is_primary)
                  const firstImage = product.product_images[0]
                  const image = primaryImage || firstImage
                  const categoryMap = new Map(categories.map(c => [c.id, c.name]))
                  return (
                    <tr key={product.id} className="border-b border-gray-200">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {image ? (
                            <img
                              src={image.image_url}
                              alt={image.alt_text || product.name}
                              className="h-10 w-10 rounded object-cover object-center"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                              No img
                            </div>
                          )}
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="font-medium text-gray-900 hover:text-green-600"
                          >
                            {product.name}
                          </Link>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {product.category_id ? (categoryMap.get(product.category_id) || '—') : '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900">
                        {formatPrice(Number(product.price))}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={product.stock_quantity <= 0 ? 'text-red-600' : 'text-gray-900'}>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {product.is_published ? 'Yes' : 'No'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/admin/products/${product.id}`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
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
