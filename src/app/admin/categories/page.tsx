import { AdminLayout } from '@/app/admin/components/admin-layout'
import { getAllCategories } from '@/lib/queries/admin'
import CategoriesManagement from './categories-management'
import type { Database } from '@/types/supabase'

type Category = Database['public']['Tables']['categories']['Row']

export default async function AdminCategoriesPage() {
  const categories = await getAllCategories()

  return (
    <AdminLayout currentPath="/admin/categories">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">
          Categories
        </h1>
        <CategoriesManagement categories={categories as Category[]} />
      </div>
    </AdminLayout>
  )
}
