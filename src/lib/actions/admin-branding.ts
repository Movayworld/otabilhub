'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { getAdminUser } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function uploadBrandingIcon(file: File): Promise<{ success: boolean; error: string | null; path?: string }> {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    return { success: false, error: 'Admin authentication required.' }
  }
  const service = createServiceClient()

  const allowedTypes = ['image/png', 'image/x-icon', 'image/jpeg', 'image/jpg']
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Invalid file type. Please upload a PNG, JPEG, or ICO file.' }
  }

  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: 'File size must be under 2 MB.' }
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png'
  const fileName = `branding/favicon.${fileExt === 'ico' ? 'ico' : 'png'}`

  const { data, error } = await service.storage
    .from('branding')
    .upload(fileName, file, {
      cacheControl: '86400',
      upsert: true,
    })

  if (error || !data) {
    console.error('Branding icon upload failed:', error)
    return { success: false, error: 'Failed to upload icon. Please try again.' }
  }

  const { data: publicUrl } = service.storage.from('branding').getPublicUrl(data.path)

  const { error: dbError } = await service
    .from('site_branding')
    .upsert({ id: '00000000-0000-0000-0000-000000000001', icon_path: publicUrl.publicUrl } as never, { onConflict: 'id' })

  if (dbError) {
    console.error('Branding config update failed:', dbError)
    return { success: false, error: 'Icon uploaded but failed to save configuration. Please try again.' }
  }

  revalidatePath('/admin/branding')
  revalidatePath('/')
  return { success: true, error: null, path: publicUrl.publicUrl }
}

