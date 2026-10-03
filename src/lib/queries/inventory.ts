import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type Movement = Database['public']['Tables']['inventory_movements']['Row']
type ProductRow = Database['public']['Tables']['products']['Row']

export async function getProductsWithStock(): Promise<
  Array<ProductRow & {
    last_movement: Movement | null
    last_movement_date: string | null
  }>
> {
  const supabase = await createClient()

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !products) {
    return []
  }

  const typedProducts = products as ProductRow[]

  const productsWithMeta = await Promise.all(
    typedProducts.map(async (product) => {
      const { data: lastMovement } = await supabase
        .from('inventory_movements')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single() as { data: Movement | null; error: any }

      return {
        ...product,
        last_movement: lastMovement ?? null,
        last_movement_date: lastMovement?.created_at ?? null,
      }
    })
  )

  return productsWithMeta
}

export async function getProductStock(productId: string): Promise<number | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('stock_quantity')
    .eq('id', productId)
    .single()

  if (error || !data) {
    return null
  }

  return (data as { stock_quantity: number }).stock_quantity
}

export async function getProductMovements(
  productId: string
): Promise<Movement[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_movements')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  if (error || !data) {
    return []
  }

  return data
}

export async function getProductWithMovements(
  productId: string
): Promise<
  (ProductRow & { movements: Movement[] }) | null
> {
  const supabase = await createClient()

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (error || !product) {
    return null
  }

  const typedProduct = product as ProductRow

  const { data: movements } = await supabase
    .from('inventory_movements')
    .select('*, profiles(full_name, email)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  return {
    ...typedProduct,
    movements: movements ?? [],
  }
}
