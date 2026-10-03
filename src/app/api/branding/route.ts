import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ icon_path: null })
  }

  const { data: branding, error } = await supabase
    .from('site_branding')
    .select('icon_path')
    .single()

  if (error || !branding) {
    return NextResponse.json({ icon_path: null })
  }

  return NextResponse.json({ icon_path: (branding as Database['public']['Tables']['site_branding']['Row']).icon_path })
}
