'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function logoutAction() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Logout error:', error)
    redirect('/account?logoutError=1')
  }

  revalidatePath('/')
  redirect('/')
}
