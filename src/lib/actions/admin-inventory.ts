'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { getAdminUser } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/supabase'

export type StockActionType = 'RESTOCK' | 'MANUAL_ADJUSTMENT' | 'CORRECTION' | 'DAMAGED'

export interface StockOperationResult {
  success: boolean
  error: string | null
  newStock?: number
}

export async function restockProduct(
  productId: string,
  quantity: number,
  reason: string,
  notes?: string
): Promise<StockOperationResult> {
  const user = await getAdminUser()
  if (!user) return { success: false, error: 'Unauthorized.' }
  const service = createServiceClient()

  const { data, error } = await service.rpc('perform_stock_operation', {
    p_product_id: productId,
    p_movement_type: 'RESTOCK',
    p_quantity_change: Math.abs(quantity),
    p_reason: reason || 'Restock',
    p_notes: notes || null,
    p_created_by: user.id,
  })

  if (error || !data) {
    console.error('Restock failed:', error)
    return { success: false, error: error?.message || 'Failed to restock.' }
  }

  const row = data as unknown as { success: boolean; error: string | null; new_stock: number | null }
  return {
    success: row.success,
    error: row.error,
    newStock: row.new_stock ?? undefined,
  }
}

export async function adjustStock(
  productId: string,
  quantity: number,
  reason: string,
  notes?: string
): Promise<StockOperationResult> {
  const user = await getAdminUser()
  if (!user) return { success: false, error: 'Unauthorized.' }
  const service = createServiceClient()

  const { data, error } = await service.rpc('perform_stock_operation', {
    p_product_id: productId,
    p_movement_type: 'MANUAL_ADJUSTMENT',
    p_quantity_change: quantity,
    p_reason: reason || 'Manual adjustment',
    p_notes: notes || null,
    p_created_by: user.id,
  })

  if (error || !data) {
    console.error('Manual adjustment failed:', error)
    return { success: false, error: error?.message || 'Failed to adjust stock.' }
  }

  const row = data as unknown as { success: boolean; error: string | null; new_stock: number | null }
  return {
    success: row.success,
    error: row.error,
    newStock: row.new_stock ?? undefined,
  }
}

export async function correctStock(
  productId: string,
  quantity: number,
  reason: string,
  notes?: string
): Promise<StockOperationResult> {
  const user = await getAdminUser()
  if (!user) return { success: false, error: 'Unauthorized.' }
  const service = createServiceClient()

  const { data, error } = await service.rpc('perform_stock_operation', {
    p_product_id: productId,
    p_movement_type: 'CORRECTION',
    p_quantity_change: quantity,
    p_reason: reason || 'Correction',
    p_notes: notes || null,
    p_created_by: user.id,
  })

  if (error || !data) {
    console.error('Correction failed:', error)
    return { success: false, error: error?.message || 'Failed to correct stock.' }
  }

  const row = data as unknown as { success: boolean; error: string | null; new_stock: number | null }
  return {
    success: row.success,
    error: row.error,
    newStock: row.new_stock ?? undefined,
  }
}

export async function markDamaged(
  productId: string,
  quantity: number,
  reason: string,
  notes?: string
): Promise<StockOperationResult> {
  const user = await getAdminUser()
  if (!user) return { success: false, error: 'Unauthorized.' }
  const service = createServiceClient()

  const { data, error } = await service.rpc('perform_stock_operation', {
    p_product_id: productId,
    p_movement_type: 'DAMAGED',
    p_quantity_change: -Math.abs(quantity),
    p_reason: reason || 'Damaged goods',
    p_notes: notes || null,
    p_created_by: user.id,
  })

  if (error || !data) {
    console.error('Damaged stock failed:', error)
    return { success: false, error: error?.message || 'Failed to mark damaged.' }
  }

  const row = data as unknown as { success: boolean; error: string | null; new_stock: number | null }
  return {
    success: row.success,
    error: row.error,
    newStock: row.new_stock ?? undefined,
  }
}
