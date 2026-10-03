'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

export interface ServiceRequestFormData {
  serviceType: string
  productName?: string
  phone: string
  address: string
  preferredDate?: string
  notes?: string
}

export async function createServiceRequest(
  data: ServiceRequestFormData
): Promise<{ success: boolean; error: string | null; id?: string }> {
  const supabase = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()

  const notesParts = [
    data.notes?.trim() || null,
    data.productName ? `Product: ${data.productName}` : null,
    `Phone: ${data.phone.trim()}`,
  ].filter(Boolean)

  const { data: createdData, error } = await supabase.from('service_requests').insert({
    profile_id: user?.id || null,
    service_type: data.serviceType,
    address: data.address.trim() || null,
    scheduled_at: data.preferredDate ? new Date(data.preferredDate).toISOString() : null,
    notes: notesParts.join('\n'),
    status: 'pending',
  } as never).select('id').single()

  if (error) {
    console.error('Service request creation failed:', error)
    return { success: false, error: 'Failed to submit your request. Please try again.' }
  }

  revalidatePath('/services')
  return { success: true, error: null, id: createdData?.id }
}
