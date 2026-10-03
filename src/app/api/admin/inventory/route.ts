import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const user = await getAdminUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { createServiceClient } = await import('@/lib/supabase/service')
    const service = createServiceClient()

    const { data: products, error } = await service
      .from('products')
      .select('*, product_images!inner(id, image_url, is_primary)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Inventory API error:', error)
      return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
    }

    const productsWithStock = (products ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stock_quantity: p.stock_quantity,
      is_published: p.is_published,
      is_featured: p.is_featured,
      price: Number(p.price),
      image_url: p.product_images?.[0]?.image_url || null,
      categories: p.categories,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }))

    return NextResponse.json(productsWithStock)
  } catch (err) {
    console.error('Inventory API exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
