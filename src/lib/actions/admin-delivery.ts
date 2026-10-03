'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getAdminUser } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/supabase'

type DeliveryLocation = Database['public']['Tables']['delivery_locations']['Row']

export interface DeliveryFormValues {
  id?: string
  name: string
  region: string
  city: string
  delivery_fee: number
  estimated_delivery: string
  is_active: boolean
}

export async function createDeliveryLocation(input: DeliveryFormValues): Promise<{ success: boolean; error: string | null; id?: string }> {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    return { success: false, error: 'Admin authentication required.' }
  }
  const service = createServiceClient()

  const locationData: Database['public']['Tables']['delivery_locations']['Insert'] = {
    name: input.name.trim(),
    region: input.region.trim(),
    city: input.city.trim(),
    delivery_fee: input.delivery_fee,
    estimated_delivery: input.estimated_delivery.trim(),
    is_active: input.is_active,
  }

  const { data, error } = await service
    .from('delivery_locations')
    .insert(locationData)
    .select('id')
    .single()

  if (error || !data) {
    console.error('Delivery location creation failed:', error)
    return { success: false, error: 'Failed to create delivery location. Please try again.' }
  }

  revalidatePath('/admin/delivery')
  return { success: true, error: null, id: (data as { id: string }).id }
}

export async function updateDeliveryLocation(id: string, input: DeliveryFormValues): Promise<{ success: boolean; error: string | null }> {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    return { success: false, error: 'Admin authentication required.' }
  }
  const service = createServiceClient()

  const locationData: Database['public']['Tables']['delivery_locations']['Update'] = {
    name: input.name.trim(),
    region: input.region.trim(),
    city: input.city.trim(),
    delivery_fee: input.delivery_fee,
    estimated_delivery: input.estimated_delivery.trim(),
    is_active: input.is_active,
  }

  const { error } = await service
    .from('delivery_locations')
    .update(locationData)
    .eq('id', id)

  if (error) {
    console.error('Delivery location update failed:', error)
    return { success: false, error: 'Failed to update delivery location. Please try again.' }
  }

  revalidatePath('/admin/delivery')
  return { success: true, error: null }
}

export async function toggleDeliveryLocationStatus(id: string, isActive: boolean): Promise<{ success: boolean; error: string | null }> {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    return { success: false, error: 'Admin authentication required.' }
  }
  const service = createServiceClient()

  const { error } = await service
    .from('delivery_locations')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) {
    console.error('Delivery location toggle failed:', error)
    return { success: false, error: 'Failed to update delivery location. Please try again.' }
  }

  revalidatePath('/admin/delivery')
  return { success: true, error: null }
}

export async function deleteDeliveryLocation(id: string): Promise<{ success: boolean; error: string | null }> {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    return { success: false, error: 'Admin authentication required.' }
  }
  const service = createServiceClient()

  const { data: existingOrders } = await service
    .from('orders')
    .select('id')
    .eq('delivery_location_id', id)
    .limit(1)

  if (existingOrders && existingOrders.length > 0) {
    return {
      success: false,
      error: 'This delivery location cannot be deleted because it is referenced by existing orders.',
    }
  }

  const { error } = await service
    .from('delivery_locations')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Delivery location deletion failed:', error)
    return { success: false, error: 'Failed to delete delivery location. Please try again.' }
  }

  revalidatePath('/admin/delivery')
  return { success: true, error: null }
}

export async function getDeliveryLocationsData(): Promise<DeliveryLocation[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('delivery_locations')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    return []
  }

  return data as DeliveryLocation[]
}
