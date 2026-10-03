'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

export async function getContactMessageCount(): Promise<number> {
  const service = createServiceClient()

  const { count, error } = await service
    .from('contact_messages')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Failed to fetch contact message count:', error)
    return 0
  }

  return count ?? 0
}
