import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type DeliveryLocation = Database['public']['Tables']['delivery_locations']['Row']

export async function getActiveDeliveryLocations(): Promise<DeliveryLocation[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('delivery_locations')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Failed to fetch delivery locations:', error)
    return []
  }

  return data as DeliveryLocation[]
}

export async function getAllDeliveryLocations(): Promise<DeliveryLocation[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('delivery_locations')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Failed to fetch delivery locations:', error)
    return []
  }

  return data as DeliveryLocation[]
}

export async function getDeliveryLocationById(id: string): Promise<DeliveryLocation | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('delivery_locations')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return data as DeliveryLocation
}
