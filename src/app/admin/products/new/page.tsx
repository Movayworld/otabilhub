import { AdminLayout } from '@/app/admin/components/admin-layout'
import { ProductForm } from '@/app/admin/products/components/product-form'
import { getAllCategories } from '@/lib/queries/admin'
import type { Database } from '@/types/supabase'

type Category = Database['public']['Tables']['categories']['Row']

export default async function NewProductPage() {
  const categories = await getAllCategories()

  return (
    <AdminLayout currentPath="/admin/products">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">
          Add Product
        </h1>
        <ProductForm product={null} categories={categories as Category[]} />
      </div>
    </AdminLayout>
  )
}
