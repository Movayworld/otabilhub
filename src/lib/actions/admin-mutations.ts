'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getAdminUser } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { notifyStatusChange } from '@/lib/notifications'
import type { Database } from '@/types/supabase'

type ProductInsert = Database['public']['Tables']['products']['Insert']
type ProductUpdate = Database['public']['Tables']['products']['Update']
type CategoryInsert = Database['public']['Tables']['categories']['Insert']
type CategoryUpdate = Database['public']['Tables']['categories']['Update']
type HeroInsert = Database['public']['Tables']['hero_configs']['Insert']
type HeroUpdate = Database['public']['Tables']['hero_configs']['Update']
type ServiceRequestUpdate = Database['public']['Tables']['service_requests']['Update']

export interface ProductFormValues {
  id?: string
  name: string
  slug: string
  description: string
  short_description: string
  price: number
  compare_at_price: number | null
  stock_quantity: number
  is_available: boolean
  is_featured: boolean
  is_published: boolean
  category_id: string | null
  specifications: Record<string, unknown>
  card_layout?: 'standard' | 'featured' | 'compact' | 'minimal' | 'overlay' | 'horizontal-card'
  homepage_layout?: 'horizontal' | 'vertical'
}

export async function createProduct(input: ProductFormValues): Promise<{ success: boolean; error: string | null; id?: string }> {
   const adminUser = await getAdminUser()
  if (!adminUser) {
    return { success: false, error: 'Admin authentication required.' }
  }
  const supabase = await createClient()

  const mergedSpecs = {
    ...input.specifications,
    _card_layout: input.card_layout ?? 'standard',
    _homepage_layout: input.homepage_layout ?? 'vertical',
  }

  const productData: ProductInsert = {
    name: input.name,
    slug: input.slug,
    description: input.description,
    short_description: input.short_description,
    price: String(input.price),
    compare_at_price: input.compare_at_price ? String(input.compare_at_price) : null,
    stock_quantity: input.stock_quantity,
    is_available: input.is_available,
    is_featured: input.is_featured,
    is_published: input.is_published,
    category_id: input.category_id,
    card_layout: input.card_layout ?? 'standard',
    homepage_section: 'all',
    homepage_order: 0,
    specifications: mergedSpecs as unknown as ProductInsert['specifications'],
  }

  const { data, error } = await supabase
    .from('products')
    .insert(productData as never)
    .select('id')
    .single()

  if (error || !data) {
    console.error('Product creation failed:', error)
    return { success: false, error: 'Failed to create product. Please try again.' }
  }

  revalidatePath('/admin/products')
  return { success: true, error: null, id: (data as { id: string }).id }
}

export async function updateProduct(id: string, input: ProductFormValues): Promise<{ success: boolean; error: string | null }> {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    return { success: false, error: 'Admin authentication required.' }
  }
  const supabase = await createClient()

  const { data: currentProductRaw } = await supabase
    .from('products')
    .select('stock_quantity')
    .eq('id', id)
    .single()

  const currentProduct = currentProductRaw as { stock_quantity: number } | null

  const mergedSpecs = {
    ...input.specifications,
    _card_layout: input.card_layout ?? 'standard',
    _homepage_layout: input.homepage_layout ?? 'vertical',
  }

  const nonStockData: ProductUpdate = {
    name: input.name,
    slug: input.slug,
    description: input.description,
    short_description: input.short_description,
    price: String(input.price),
    compare_at_price: input.compare_at_price ? String(input.compare_at_price) : null,
    is_available: input.is_available,
    is_featured: input.is_featured,
    is_published: input.is_published,
    category_id: input.category_id,
    card_layout: input.card_layout ?? 'standard',
    homepage_section: 'all',
    specifications: mergedSpecs as unknown as ProductUpdate['specifications'],
  }

  if (Object.keys(nonStockData).length > 0) {
    const { error: updateError } = await supabase
      .from('products')
      .update(nonStockData as never)
      .eq('id', id)

    if (updateError) {
      console.error('Product update failed:', JSON.stringify(updateError, null, 2))
      return { success: false, error: 'Failed to update product. Please try again.' }
    }
  }

  if (currentProduct && currentProduct.stock_quantity !== input.stock_quantity) {
    const quantityChange = input.stock_quantity - currentProduct.stock_quantity
    const result = await (supabase.rpc('perform_stock_operation', {
      p_product_id: id,
      p_movement_type: quantityChange > 0 ? 'RESTOCK' : 'MANUAL_ADJUSTMENT',
      p_quantity_change: Math.abs(quantityChange),
      p_reason: quantityChange > 0 ? 'Stock updated via product edit' : 'Stock reduced via product edit',
    } as any) as any as {
      data: { success: boolean; error: string | null; new_stock: number | null; movement_id: string | null }
      error: any
    })

    const { data, error: stockError } = result

    if (stockError) {
      console.error('Stock update failed:', stockError)
      return { success: false, error: 'Failed to update stock. Please try again.' }
    }

    const row = data as unknown as { success: boolean; error: string | null }
    if (!row.success) {
      return { success: false, error: row.error || 'Failed to update stock.' }
    }
  }

  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${id}`)
  revalidatePath('/shop')
  revalidatePath('/')
  return { success: true, error: null }
}

export async function deleteProduct(id: string): Promise<{ success: boolean; error: string | null }> {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    return { success: false, error: 'Admin authentication required.' }
  }
  const supabase = await createClient()

  // Remove the stored image files first: the product_images rows cascade with
  // the product, but storage objects do not, so they would be orphaned.
  const { data: images } = await supabase
    .from('product_images')
    .select('image_url')
    .eq('product_id', id)

  const paths: string[] = []
  for (const image of (images ?? []) as Array<{ image_url: string }>) {
    try {
      const url = new URL(image.image_url)
      const prefix = '/storage/v1/object/public/'
      const idx = url.pathname.indexOf(prefix)
      if (idx === -1) continue
      const remainder = url.pathname.slice(idx + prefix.length)
      const slash = remainder.indexOf('/')
      if (slash !== -1) paths.push(remainder.slice(slash + 1))
    } catch {
      // Ignore malformed URLs; the row deletion below still proceeds.
    }
  }
  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from('product-images')
      .remove(paths)
    if (storageError) {
      console.error('Failed to remove stored product images:', storageError)
    }
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Product deletion failed:', error)
    return { success: false, error: 'Failed to delete product. Please try again.' }
  }

  revalidatePath('/admin/products')
  revalidatePath('/shop')
  return { success: true, error: null }
}

export async function uploadProductImage(
  productId: string,
  file: File
): Promise<{ success: boolean; error: string | null; url?: string }> {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    return { success: false, error: 'Admin authentication required.' }
  }
  const supabase = await createClient()

  const fileExt = file.name.split('.').pop()
  const fileName = `${productId}/${crypto.randomUUID()}.${fileExt}`
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error || !data) {
    console.error('Image upload failed:', error)
    return { success: false, error: 'Failed to upload image. Please try again.' }
  }

  const { data: publicUrl } = supabase.storage
    .from('product-images')
    .getPublicUrl(data.path)

  // Append to the end of the existing gallery, and promote the first image of
  // a product to primary so the storefront always has a defined primary image.
  const { count: existingCount } = await supabase
    .from('product_images')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId)

  const position = existingCount ?? 0

  const { error: imageError } = await supabase
    .from('product_images')
    .insert({
      product_id: productId,
      image_url: publicUrl.publicUrl,
      alt_text: file.name,
      position,
      is_primary: position === 0,
    } as never)

  if (imageError) {
    console.error('Image record creation failed:', imageError)
    return { success: false, error: 'Image uploaded but failed to save record. Please try again.' }
  }

  revalidatePath(`/admin/products/${productId}`)
  return { success: true, error: null, url: publicUrl.publicUrl }
}

export async function setPrimaryImage(productId: string, imageId: string): Promise<{ success: boolean; error: string | null }> {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    return { success: false, error: 'Admin authentication required.' }
  }
  const supabase = await createClient()

  await supabase
    .from('product_images')
    .update({ is_primary: false } as never)
    .eq('product_id', productId)

  const { error } = await supabase
    .from('product_images')
    .update({ is_primary: true } as never)
    .eq('id', imageId)
    .eq('product_id', productId)

  if (error) {
    console.error('Failed to set primary image:', error)
    return { success: false, error: 'Failed to set primary image.' }
  }

  revalidatePath(`/admin/products/${productId}`)
  return { success: true, error: null }
}

export async function deleteProductImage(imageId: string, productId: string): Promise<{ success: boolean; error: string | null }> {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    return { success: false, error: 'Admin authentication required.' }
  }
  const supabase = await createClient()

  const { data: imageRecord } = await supabase
    .from('product_images')
    .select('image_url')
    .eq('id', imageId)
    .single() as { data: { image_url: string } | null; error: any }

  if (imageRecord?.image_url) {
    const url = new URL(imageRecord.image_url)
    const prefix = '/storage/v1/object/public/'
    const idx = url.pathname.indexOf(prefix)
    if (idx !== -1) {
      // The public URL is /storage/v1/object/public/<bucket>/<path>; the
      // Storage API expects the path WITHOUT the bucket segment.
      const remainder = url.pathname.slice(idx + prefix.length)
      const slash = remainder.indexOf('/')
      if (slash !== -1) {
        const bucket = remainder.slice(0, slash)
        const filePath = remainder.slice(slash + 1)
        const { error: storageError } = await supabase.storage
          .from(bucket)
          .remove([filePath])
        if (storageError) {
          // The row is still removed below, but the orphaned asset must not be
          // ignored silently.
          console.error('Failed to remove stored product image:', storageError)
        }
      }
    }
  }

  const { error: deleteError } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId)

  if (deleteError) {
    console.error('Failed to delete image:', deleteError)
    return { success: false, error: 'Failed to delete image.' }
  }

  // If the deleted image was the primary one, promote the first remaining
  // image so the product always has a defined primary image.
  const { data: remaining } = await supabase
    .from('product_images')
    .select('id, is_primary, position')
    .eq('product_id', productId)
    .order('position', { ascending: true })

  if (
    remaining &&
    remaining.length > 0 &&
    !(remaining as Array<{ id: string; is_primary: boolean }>).some((img) => img.is_primary)
  ) {
    await supabase
      .from('product_images')
      .update({ is_primary: true } as never)
      .eq('id', (remaining[0] as { id: string }).id)
  }

  revalidatePath(`/admin/products/${productId}`)
  return { success: true, error: null }
}

export async function createCategory(input: { name: string; slug: string; description?: string; display_mode?: 'grid' | 'horizontal' }): Promise<{ success: boolean; error: string | null }> {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    return { success: false, error: 'Admin authentication required.' }
  }
  const supabase = await createClient()

  const categoryData: CategoryInsert = {
    name: input.name,
    slug: input.slug,
    description: input.description || null,
    display_mode: input.display_mode ?? 'grid',
  }

  const { error } = await supabase
    .from('categories')
    .insert(categoryData as never)

  if (error) {
    console.error('Category creation failed:', error)
    return { success: false, error: 'Failed to create category. Please try again.' }
  }

  revalidatePath('/admin/categories')
  revalidatePath('/')
  revalidatePath('/shop')
  return { success: true, error: null }
}

export async function updateCategory(id: string, input: { name: string; slug: string; description?: string; is_active?: boolean; display_mode?: 'grid' | 'horizontal' }): Promise<{ success: boolean; error: string | null }> {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    return { success: false, error: 'Admin authentication required.' }
  }
  const supabase = await createClient()

  const categoryData: CategoryUpdate = {
    name: input.name,
    slug: input.slug,
    description: input.description || null,
    is_active: input.is_active ?? true,
    display_mode: input.display_mode ?? 'grid',
  }

  const { error } = await supabase
    .from('categories')
    .update(categoryData as never)
    .eq('id', id)

  if (error) {
    console.error('Category update failed:', error)
    return { success: false, error: 'Failed to update category. Please try again.' }
  }

  revalidatePath('/admin/categories')
  revalidatePath('/')
  revalidatePath('/shop')
  return { success: true, error: null }
}

export async function deleteCategory(id: string): Promise<{ success: boolean; error: string | null }> {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    return { success: false, error: 'Admin authentication required.' }
  }
  const supabase = await createClient()

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Category deletion failed:', error)
    return { success: false, error: 'Failed to delete category. Please try again.' }
  }

  revalidatePath('/admin/categories')
  revalidatePath('/shop')
  return { success: true, error: null }
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['completed', 'cancelled'],
  completed: ['cancelled'],
  cancelled: [],
}

export async function updateOrderStatus(orderId: string, status: string): Promise<{ success: boolean; error: string | null }> {
  const user = await getAdminUser()
  if (!user) return { success: false, error: 'Unauthorized.' }
  const service = createServiceClient()

  const { data: order, error: fetchError } = await service
    .from('orders')
    .select('id, status, order_items(product_id, quantity)')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) {
    return { success: false, error: 'Order not found.' }
  }

  const allowedNext = STATUS_TRANSITIONS[order.status] ?? []
  if (!allowedNext.includes(status)) {
    return { success: false, error: `Cannot change order status from "${order.status}" to "${status}".` }
  }

  if (status === 'cancelled' && order.status !== 'cancelled') {
    for (const item of order.order_items as Array<{ product_id: string; quantity: number }>) {
      const { data, error: stockError } = await service.rpc('perform_stock_operation', {
        p_product_id: item.product_id,
        p_movement_type: 'CANCELLATION_RESTOCK',
        p_quantity_change: item.quantity,
        p_reason: `Order ${orderId.slice(0, 8).toUpperCase()} cancelled`,
        p_reference_type: 'ORDER',
        p_reference_id: orderId,
        p_created_by: user.id,
      })

      if (stockError) {
        console.error('Stock restore failed:', stockError)
        return { success: false, error: 'Failed to restore stock for cancelled order.' }
      }

      const row = data as unknown as { success: boolean; error: string | null }
      if (!row.success) {
        return { success: false, error: row.error || 'Failed to restore stock.' }
      }
    }
  }

  const oldStatus = order.status

  const { error } = await service
    .from('orders')
    .update({ status } as never)
    .eq('id', orderId)

  if (error) {
    console.error('Order status update failed:', error)
    return { success: false, error: 'Failed to update order status. Please try again.' }
  }

  try {
    await notifyStatusChange(orderId, oldStatus, status)
  } catch (notifErr) {
    console.error('Status notification failed:', notifErr)
  }

  try {
    await service.from('order_status_history').insert({
      order_id: orderId,
      status_from: oldStatus,
      status_to: status,
      changed_by: user.id,
    })
  } catch {
    // Table might not exist yet
  }

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)
  return { success: true, error: null }
}

export async function updatePaymentState(orderId: string, paymentState: string): Promise<{ success: boolean; error: string | null }> {
  const user = await getAdminUser()
  if (!user) return { success: false, error: 'Unauthorized.' }
  const service = createServiceClient()

  const { error } = await service
    .from('orders')
    .update({ payment_state: paymentState } as never)
    .eq('id', orderId)

  if (error) {
    console.error('Payment state update failed:', error)
    return { success: false, error: 'Failed to update payment state. Please try again.' }
  }

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)
  return { success: true, error: null }
}

export async function updateServiceRequest(
  id: string,
  input: {
    status?: string
    scheduled_at?: string | null
    notes?: string | null
    address?: string | null
    price?: number | null
  }
): Promise<{ success: boolean; error: string | null }> {
  await getAdminUser()
  const supabase = await createClient()

  const updateData: Database['public']['Tables']['service_requests']['Update'] = {}
  if (input.status !== undefined) updateData.status = input.status
  if (input.scheduled_at !== undefined) updateData.scheduled_at = input.scheduled_at
  if (input.notes !== undefined) updateData.notes = input.notes
  if (input.address !== undefined) updateData.address = input.address
  if (input.price !== undefined) updateData.price = input.price !== null ? String(input.price) : null

  const { error } = await supabase
    .from('service_requests')
    .update(updateData as never)
    .eq('id', id)

  if (error) {
    console.error('Service request update failed:', error)
    return { success: false, error: 'Failed to update service request. Please try again.' }
  }

  revalidatePath('/admin/service-requests')
  revalidatePath(`/admin/service-requests/${id}`)
  return { success: true, error: null }
}

export async function saveHeroConfig(input: {
  id?: string
  image_url: string
  image_alt: string | null
  heading: string
  subheading: string | null
  primary_cta_text: string
  primary_cta_url: string
  secondary_cta_text: string | null
  secondary_cta_url: string | null
}): Promise<{ success: boolean; error: string | null }> {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    return { success: false, error: 'Admin authentication required.' }
  }
  const service = createServiceClient()

  if (input.id) {
    const heroData: HeroUpdate = {
      image_url: input.image_url,
      image_alt: input.image_alt,
      heading: input.heading,
      subheading: input.subheading,
      primary_cta_text: input.primary_cta_text,
      primary_cta_url: input.primary_cta_url,
      secondary_cta_text: input.secondary_cta_text,
      secondary_cta_url: input.secondary_cta_url,
    }

    const { error } = await service
      .from('hero_configs')
      .update(heroData)
      .eq('id', input.id)

    if (error) {
      console.error('Hero config update failed:', error)
      return { success: false, error: 'Failed to update hero configuration.' }
    }
  } else {
    await service
      .from('hero_configs')
      .update({ is_active: false })
      .eq('is_active', true)

    const heroData: HeroInsert = {
      image_url: input.image_url,
      image_alt: input.image_alt,
      heading: input.heading,
      subheading: input.subheading,
      primary_cta_text: input.primary_cta_text,
      primary_cta_url: input.primary_cta_url,
      secondary_cta_text: input.secondary_cta_text,
      secondary_cta_url: input.secondary_cta_url,
      is_active: true,
    }

    const { error } = await service
      .from('hero_configs')
      .insert(heroData)

    if (error) {
      console.error('Hero config creation failed:', error)
      return { success: false, error: 'Failed to create hero configuration.' }
    }
  }

  revalidatePath('/')
  revalidatePath('/admin/hero')
  return { success: true, error: null }
}

export async function uploadHeroImage(file: File): Promise<{ success: boolean; error: string | null; url?: string }> {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    return { success: false, error: 'Admin authentication required.' }
  }
  const supabase = await createClient()

  const fileExt = file.name.split('.').pop()
  const fileName = `hero/${crypto.randomUUID()}.${fileExt}`
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error || !data) {
    console.error('Hero image upload failed:', error)
    return { success: false, error: 'Failed to upload image. Please try again.' }
  }

  const { data: publicUrl } = supabase.storage
    .from('product-images')
    .getPublicUrl(data.path)

  return { success: true, error: null, url: publicUrl.publicUrl }
}
