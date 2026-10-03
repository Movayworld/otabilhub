import { AdminLayout } from '@/app/admin/components/admin-layout'
import { getHeroConfig } from '@/lib/queries/admin'
import HeroForm from './hero-form'
import type { Database } from '@/types/supabase'

type HeroConfig = Database['public']['Tables']['hero_configs']['Row']

export default async function AdminHeroPage() {
  const heroConfig = await getHeroConfig()
  return (
    <AdminLayout currentPath="/admin/hero">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">Homepage Hero</h1>
      <HeroForm heroConfig={heroConfig as HeroConfig | null} />
    </AdminLayout>
  )
}
