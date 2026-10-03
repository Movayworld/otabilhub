import { AdminLayout } from '@/app/admin/components/admin-layout'
import AdminCustomersContent from './admin-customers-content'

export default async function AdminCustomersPage() {
  return (
    <AdminLayout currentPath="/admin/customers">
      <AdminCustomersContent />
    </AdminLayout>
  )
}
