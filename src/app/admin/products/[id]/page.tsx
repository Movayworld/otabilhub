import { notFound } from 'next/navigation'
import { AdminLayout } from '@/app/admin/components/admin-layout'
import { ProductForm } from '@/app/admin/products/components/product-form'
import { getProductById, getAllCategories } from '@/lib/queries/admin'
import type { Database } from '@/types/supabase'

type ProductWithImages = Database['public']['Tables']['products']['Row'] & {
  product_images: Database['public']['Tables']['product_images']['Row'][]
}
type Category = Database['public']['Tables']['categories']['Row']

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [product, categories] = await Promise.all([
    getProductById(id),
    getAllCategories(),
  ])

  if (!product) {
    notFound()
  }

  return (
    <AdminLayout currentPath="/admin/products">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">
          Edit Product
        </h1>
        <ProductForm
          product={product as ProductWithImages}
          categories={categories as Category[]}
        />
      </div>
    </AdminLayout>
  )
}
