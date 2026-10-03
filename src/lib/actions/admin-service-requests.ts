'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateServiceRequestStatus(
  id: string,
  status: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('service_requests')
    .update({ status } as never)
    .eq('id', id)

  if (error) {
    console.error('Service request status update failed:', error)
    return { success: false, error: 'Failed to update status. Please try again.' }
  }

  revalidatePath('/admin/service-requests')
  return { success: true, error: null }
}
