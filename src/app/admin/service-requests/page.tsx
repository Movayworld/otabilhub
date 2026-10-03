import { AdminLayout } from '@/app/admin/components/admin-layout'
import { getAdminServiceRequests } from '@/lib/queries/admin'
import type { Database } from '@/types/supabase'
import Link from 'next/link'

type ServiceRequest = Database['public']['Tables']['service_requests']['Row']

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    pending: 'Pending',
    contacted: 'Contacted',
    scheduled: 'Scheduled',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }

  const styles: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    contacted: 'bg-blue-100 text-blue-700',
    scheduled: 'bg-orange-100 text-orange-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}
    >
      {labels[status] || status}
    </span>
  )
}

export default async function AdminServiceRequestsPage() {
  const requests = await getAdminServiceRequests()

  return (
    <AdminLayout currentPath="/admin/service-requests">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">
          Service Requests
        </h1>

        {requests.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">No service requests yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Phone</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Address</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const phoneMatch = req.notes?.match(/Phone:\s*([^\n]+)/)
                  const phone = phoneMatch ? phoneMatch[1].trim() : '-'
                  return (
                  <tr key={req.id} className="border-b border-gray-200">
                    <td className="py-3 px-4 text-gray-500">
                      #{req.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3 px-4 text-gray-900">{req.service_type}</td>
                    <td className="py-3 px-4 text-gray-900">{phone}</td>
                    <td className="py-3 px-4 text-gray-900">{req.address || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/admin/service-requests/${req.id}`}>
                        <span className="text-sm text-gray-600 hover:text-green-600">
                          View
                        </span>
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
