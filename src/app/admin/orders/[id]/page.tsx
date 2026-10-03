import { AdminLayout } from '@/app/admin/components/admin-layout'
import { getAdminOrderById } from '@/lib/queries/admin'
import type { Database } from '@/types/supabase'
import { notFound } from 'next/navigation'
import OrderDetail from './order-detail'

type Order = Database['public']['Tables']['orders']['Row'] & {
  order_items: Database['public']['Tables']['order_items']['Row'][]
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await getAdminOrderById(id)

  if (!order) {
    notFound()
  }

  return (
    <AdminLayout currentPath="/admin/orders">
      <OrderDetail order={order as Order} />
    </AdminLayout>
  )
}
