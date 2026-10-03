import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function getAdminUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin')

  if (adminError || !isAdmin) {
    return null
  }

  return user
}

export async function requireAdmin() {
  const user = await getAdminUser()
  if (!user) {
    redirect('/admin/login')
  }
  return user
}
