import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin')

  if (adminError || !isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  }

  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, subscribed_at, is_active')
    .order('subscribed_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch subscribers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscribers' },
      { status: 500 }
    )
  }

  return NextResponse.json({ subscribers: data })
}
