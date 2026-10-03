import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type Order = Database['public']['Tables']['orders']['Row'] & {
  order_items: Database['public']['Tables']['order_items']['Row'][]
}

export async function getUserOrders(): Promise<Order[] | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch orders:', error)
    return null
  }

  return orders as Order[] | null
}

export async function getUserOrderById(
  orderId: string
): Promise<Order | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: order, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .eq('profile_id', user.id)
    .single()

  if (error || !order) {
    return null
  }

  return order as Order | null
}
