import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/supabase/admin'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  const user = await getAdminUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const service = createServiceClient()

    const { data: orders, error } = await service
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Orders API error:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    return NextResponse.json({ orders: orders ?? [] })
  } catch (err) {
    console.error('Orders API exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
