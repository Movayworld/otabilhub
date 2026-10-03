import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

export async function getSiteBranding(): Promise<{ icon_path: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('site_branding')
    .select('icon_path')
    .single()

  if (error || !data) {
    return { icon_path: null }
  }

  return { icon_path: (data as Database['public']['Tables']['site_branding']['Row']).icon_path }
}
