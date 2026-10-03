import { AdminLayout } from '@/app/admin/components/admin-layout'
import AdminContactContent from './admin-contact-content'

export default async function AdminContactPage() {
  return (
    <AdminLayout currentPath="/admin/contact">
      <AdminContactContent />
    </AdminLayout>
  )
}
