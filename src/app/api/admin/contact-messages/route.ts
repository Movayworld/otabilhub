import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin')

  if (adminError || !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const search = searchParams.get('search') || ''
  const filter = searchParams.get('filter') || 'all'

  let query = supabase
    .from('contact_messages')
    .select('id, name, email, phone, subject, message, read, created_at')
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%`)
  }

  if (filter === 'unread') {
    query = query.eq('read', false)
  } else if (filter === 'read') {
    query = query.eq('read', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to fetch contact messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }

  return NextResponse.json({ messages: data || [] })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin')

  if (adminError || !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { id, read } = body

  if (!id || typeof read !== 'boolean') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { error } = await supabase
    .from('contact_messages')
    .update({ read } as never)
    .eq('id', id)

  if (error) {
    console.error('Failed to update contact message:', error)
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin')

  if (adminError || !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { id } = body

  if (!id) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { error } = await supabase
    .from('contact_messages')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete contact message:', error)
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
