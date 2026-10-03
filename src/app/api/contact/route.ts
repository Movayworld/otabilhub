import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { email, name, phone, subject, message } = body

  if (!name || !email || !message) {
    return NextResponse.json(
      { success: false, error: 'Name, email, and message are required.' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { error } = await supabase.from('contact_messages').insert({
    name,
    email,
    phone: phone || null,
    subject: subject || null,
    message,
  } as never)

  if (error) {
    console.error('Contact message creation failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send your message. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, error: null })
}
