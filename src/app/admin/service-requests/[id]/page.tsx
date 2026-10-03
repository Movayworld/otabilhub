import { AdminLayout } from '@/app/admin/components/admin-layout'
import { getAdminServiceRequestById } from '@/lib/queries/admin'
import type { Database } from '@/types/supabase'
import { notFound } from 'next/navigation'
import ServiceRequestDetail from './service-request-detail'

type ServiceRequest = Database['public']['Tables']['service_requests']['Row']

export default async function AdminServiceRequestPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const request = await getAdminServiceRequestById(id)

  if (!request) {
    notFound()
  }

  return (
    <AdminLayout currentPath="/admin/service-requests">
      <ServiceRequestDetail request={request as ServiceRequest} />
    </AdminLayout>
  )
}
