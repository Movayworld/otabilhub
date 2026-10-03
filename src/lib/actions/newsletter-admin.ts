'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

export async function getSubscriberCount(): Promise<number> {
  const service = createServiceClient()

  const { count, error } = await service
    .from('newsletter_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  if (error) {
    console.error('Failed to fetch subscriber count:', error)
    return 0
  }

  return count ?? 0
}
