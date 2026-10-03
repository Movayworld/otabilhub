import { AdminLayout } from '@/app/admin/components/admin-layout'
import AdminNewsletterContent from './admin-newsletter-content'

export default async function AdminNewsletterPage() {
  return (
    <AdminLayout currentPath="/admin/newsletter">
      <AdminNewsletterContent />
    </AdminLayout>
  )
}
