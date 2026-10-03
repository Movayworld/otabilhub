'use server'

import { createClient } from '@/lib/supabase/server'

export interface ContactFormData {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

export async function createContactMessage(
  data: ContactFormData
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase.from('contact_messages').insert({
    name: data.name.trim(),
    email: data.email.trim(),
    phone: data.phone.trim() || null,
    subject: data.subject.trim(),
    message: data.message.trim(),
  } as never)

  if (error) {
    console.error('Contact message creation failed:', error)
    return { success: false, error: 'Failed to send your message. Please try again.' }
  }

  return { success: true, error: null }
}
