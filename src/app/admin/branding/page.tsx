import { AdminLayout } from '@/app/admin/components/admin-layout'
import BrandingForm from './branding-form'
import { getSiteBranding } from '@/lib/queries/branding'

export default async function AdminBrandingPage() {
  const { icon_path } = await getSiteBranding()

  return (
    <AdminLayout currentPath="/admin/branding">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">Branding</h1>
      <BrandingForm initialIcon={icon_path} />
    </AdminLayout>
  )
}
