import type { Database } from './supabase'

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  currency: string
  stock: number
  is_featured: boolean
  category_id: string | null
  image_url: string | null
  specifications: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  address: string | null
  created_at: string
  updated_at: string
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface Order {
  id: string
  profile_id: string
  total: number
  currency: string
  status: OrderStatus
  shipping_address: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  quantity: number
  price: number
  created_at: string
}

export type ServiceRequestStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface ServiceRequest {
  id: string
  profile_id: string | null
  product_id: string | null
  service_type: string
  status: ServiceRequestStatus
  scheduled_at: string | null
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CartItem {
  product: Product
  quantity: number
  installation_requested: boolean
}

export type { Database }
