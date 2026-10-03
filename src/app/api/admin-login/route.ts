import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ success: false, error: 'Email and password are required.' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  })

  if (error || !data.user) {
    return NextResponse.json({ success: false, error: 'Incorrect email or password.' }, { status: 401 })
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin')

  if (adminError || !isAdmin) {
    await supabase.auth.signOut()
    return NextResponse.json({ success: false, error: 'Access denied.' }, { status: 403 })
  }

  return NextResponse.json({ success: true, error: null })
}
