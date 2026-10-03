import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getAdminUser } from '@/lib/supabase/admin'
import { generateCustomerId, isValidCustomerId, extractUuidFromCustomerId } from '@/lib/utils/customer-id'

export async function GET(request: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() || ''

  let queryBuilder = service.from('profiles').select('id, full_name, email, phone, city, created_at')

  if (query) {
    if (isValidCustomerId(query.toUpperCase())) {
      const uuid = extractUuidFromCustomerId(query.toUpperCase())
      if (uuid) {
        queryBuilder = queryBuilder.eq('id', uuid)
      }
    } else {
      queryBuilder = queryBuilder.or(
        `full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%,city.ilike.%${query}%`
      )
    }
  }

  const { data, error } = await queryBuilder.order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch customers:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }

  const customersWithOrders = await Promise.all(
    (data || []).map(async (customer) => {
      const { count: orderCount } = await service
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', (customer as { id: string }).id)

      return {
        ...customer,
        customer_id: generateCustomerId((customer as { id: string }).id),
        order_count: orderCount ?? 0,
      }
    })
  )

  return NextResponse.json({ customers: customersWithOrders })
}
