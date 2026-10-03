import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/supabase'
import { getAdminUser } from '@/lib/supabase/admin'

type Product = Database['public']['Tables']['products']['Row'] & {
  product_images: Database['public']['Tables']['product_images']['Row'][]
  categories: { id: string; name: string; slug: string } | null
}

type Category = Database['public']['Tables']['categories']['Row']
type Order = Database['public']['Tables']['orders']['Row'] & {
  order_items: Database['public']['Tables']['order_items']['Row'][]
}
type ServiceRequest = Database['public']['Tables']['service_requests']['Row'] & {
  products: { id: string; name: string; slug: string } | null
  profiles: { id: string; full_name: string | null; email: string } | null
}
type HeroConfig = Database['public']['Tables']['hero_configs']['Row']

export async function getAdminProducts(): Promise<Product[]> {
  await getAdminUser()
  const supabase = await createClient()
  const { data: products, error } = await supabase
    .from('products')
    .select('*, product_images(*), categories(*)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch products:', error)
    return []
  }

  return products as unknown as Product[]
}

export async function getProductById(id: string): Promise<Product | null> {
  await getAdminUser()
  const supabase = await createClient()
  const { data: product, error } = await supabase
    .from('products')
    .select('*, product_images(*), categories(*)')
    .eq('id', id)
    .single()

  if (error || !product) {
    return null
  }

  return product as unknown as Product
}

export async function getAllCategories(): Promise<Category[]> {
  await getAdminUser()
  const supabase = await createClient()
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Failed to fetch categories:', error)
    return []
  }

  return categories as Category[]
}

export async function getAdminOrders(): Promise<Order[]> {
  await getAdminUser()
  const supabase = await createClient()
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch orders:', error)
    return []
  }

  return orders as unknown as Order[]
}

export async function getAdminOrderById(id: string): Promise<Order | null> {
  await getAdminUser()
  const supabase = await createClient()
  const { data: order, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .single()

  if (error || !order) {
    return null
  }

  return order as unknown as Order
}

export async function getAdminServiceRequests(): Promise<ServiceRequest[]> {
  await getAdminUser()
  const supabase = await createClient()
  const { data: requests, error } = await supabase
    .from('service_requests')
    .select('*, products(*), profiles(*)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch service requests:', error)
    return []
  }

  return requests as unknown as ServiceRequest[]
}

export async function getAdminServiceRequestById(id: string): Promise<ServiceRequest | null> {
  await getAdminUser()
  const supabase = await createClient()
  const { data: request, error } = await supabase
    .from('service_requests')
    .select('*, products(*), profiles(*)')
    .eq('id', id)
    .single()

  if (error || !request) {
    return null
  }

  return request as unknown as ServiceRequest
}

export async function getHeroConfig(): Promise<HeroConfig | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hero_configs')
    .select('*')
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return null
  }

  return data as HeroConfig
}

export async function getAllHeroConfigs(): Promise<HeroConfig[]> {
  await getAdminUser()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hero_configs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch hero configs:', error)
    return []
  }

  return data as HeroConfig[]
}

export async function getDashboardStats() {
  await getAdminUser()
  const service = createServiceClient()

  const [productsResult, publishedResult, lowStockResult, ordersResult, pendingResult, serviceResult, customersResult, subscribersResult] = await Promise.all([
    service.from('products').select('id', { count: 'exact', head: true }),
    service.from('products').select('id', { count: 'exact', head: true }).eq('is_published', true),
    service.from('products').select('id', { count: 'exact', head: true }).lt('stock_quantity', 10),
    service.from('orders').select('id', { count: 'exact', head: true }),
    service.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    service.from('service_requests').select('id', { count: 'exact', head: true }),
    service.from('profiles').select('id', { count: 'exact', head: true }),
    service.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ])

  return {
    totalProducts: productsResult.count ?? 0,
    publishedProducts: publishedResult.count ?? 0,
    lowStockProducts: lowStockResult.count ?? 0,
    totalOrders: ordersResult.count ?? 0,
    pendingOrders: pendingResult.count ?? 0,
    totalServiceRequests: serviceResult.count ?? 0,
    totalCustomers: customersResult.count ?? 0,
    totalSubscribers: subscribersResult.count ?? 0,
  }
}
