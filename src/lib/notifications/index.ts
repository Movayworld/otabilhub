'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { sendOrderEmail, sendStatusUpdateEmail } from './email'
import { sendOrderSms, sendStatusUpdateSms } from './sms'
import type { OrderNotificationData, NotificationResult } from './types'

export async function notifyNewOrder(orderId: string): Promise<NotificationResult> {
  const service = createServiceClient()

  const { data: order, error: orderError } = await service
    .from('orders')
    .select(
      `
      id,
      status,
      total,
      currency,
      shipping_address,
      city,
      phone,
      notes,
      delivery_location_name,
      delivery_region,
      delivery_city,
      delivery_fee,
      delivery_estimated,
      created_at,
      order_items!inner(id, product_name, product_price, quantity, total_price),
      profile:profiles!inner(full_name, email, phone, address)
    `
    )
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return {
      success: false,
      error: `Order not found: ${orderError?.message}`,
      providers: [],
    }
  }

  // Build notification data
  const profile = Array.isArray(order.profile) ? order.profile[0] ?? null : order.profile ?? null
  const orderItems = Array.isArray(order.order_items) ? order.order_items : []

  const notificationData: OrderNotificationData = {
    orderId: order.id,
    orderNumber: order.id.slice(0, 8).toUpperCase(),
    customerName: profile?.full_name || 'Guest Customer',
    customerEmail: profile?.email || '',
    customerPhone: order.phone || profile?.phone || '',
    shippingAddress: order.shipping_address || profile?.address || '',
    city: order.city || profile?.address || '',
    total: Number(order.total),
    currency: order.currency || 'GHS',
    itemCount: orderItems.length,
    deliveryLocationName: order.delivery_location_name || '',
    deliveryFee: Number(order.delivery_fee || 0),
    createdAt: order.created_at || new Date().toISOString(),
    items: orderItems.map((item: Record<string, unknown>) => ({
      product_name: (item.product_name as string) || '',
      product_price: Number(item.product_price || 0),
      quantity: Number(item.quantity || 0),
      total_price: Number(item.total_price || 0),
    })),
  }

  const results: NotificationResult['providers'] = []

  // Send email notification
  const emailResult = await sendOrderEmail(notificationData)
  results.push({
    channel: 'email',
    status: emailResult.success ? 'sent' : 'failed',
    error: emailResult.error,
  })

  // Send SMS notification
  const smsResult = await sendOrderSms(notificationData)
  results.push({
    channel: 'sms',
    status: smsResult.success ? 'sent' : 'failed',
    error: smsResult.error,
  })

  // Log notification to database (if table exists)
  try {
    await service.from('notifications').insert([
      {
        order_id: orderId,
        type: 'admin',
        recipient: process.env.NOTIFICATION_ADMIN_EMAIL || process.env.NOTIFICATION_ADMIN_PHONE || '',
        message: `New order #${notificationData.orderNumber} created`,
        status: 'sent',
      },
    ])
  } catch {
    // Table might not exist yet — log to console instead
    console.log(`[NOTIFICATION] New order #${notificationData.orderNumber}: email=${emailResult.success ? 'sent' : 'failed'}, sms=${smsResult.success ? 'sent' : 'failed'}`)
  }

  const overallSuccess = results.every((r) => r.status === 'sent' || r.status === 'skipped')
  return {
    success: overallSuccess,
    providers: results,
  }
}

export async function notifyStatusChange(
  orderId: string,
  oldStatus: string,
  newStatus: string
): Promise<NotificationResult> {
  const service = createServiceClient()

  const { data: order, error: orderError } = await service
    .from('orders')
    .select(
      `
      id,
      status,
      total,
      currency,
      phone,
      shipping_address,
      city,
      delivery_location_name,
      delivery_fee,
      created_at,
      order_items!inner(id, product_name, product_price, quantity, total_price),
      profile:profiles!inner(full_name, email, phone, address)
    `
    )
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return {
      success: false,
      error: `Order not found: ${orderError?.message}`,
      providers: [],
    }
  }

  const profile = Array.isArray(order.profile) ? order.profile[0] ?? null : order.profile ?? null
  const orderItems = Array.isArray(order.order_items) ? order.order_items : []

  const notificationData: OrderNotificationData = {
    orderId: order.id,
    orderNumber: order.id.slice(0, 8).toUpperCase(),
    customerName: profile?.full_name || 'Guest Customer',
    customerEmail: profile?.email || '',
    customerPhone: order.phone || profile?.phone || '',
    shippingAddress: order.shipping_address || profile?.address || '',
    city: order.city || '',
    total: Number(order.total),
    currency: order.currency || 'GHS',
    itemCount: orderItems.length,
    deliveryLocationName: order.delivery_location_name || '',
    deliveryFee: Number(order.delivery_fee || 0),
    createdAt: order.created_at || new Date().toISOString(),
    items: orderItems.map((item: Record<string, unknown>) => ({
      product_name: (item.product_name as string) || '',
      product_price: Number(item.product_price || 0),
      quantity: Number(item.quantity || 0),
      total_price: Number(item.total_price || 0),
    })),
  }

  const results: NotificationResult['providers'] = []

  // Send customer email notification
  const emailResult = await sendStatusUpdateEmail(notificationData, oldStatus, newStatus)
  results.push({
    channel: 'email',
    status: emailResult.success ? 'sent' : 'failed',
    error: emailResult.error,
  })

  // Send customer SMS notification
  const smsResult = await sendStatusUpdateSms(notificationData, oldStatus, newStatus)
  results.push({
    channel: 'sms',
    status: smsResult.success ? 'sent' : 'failed',
    error: smsResult.error,
  })

  const overallSuccess = results.every((r) => r.status !== 'failed')
  return {
    success: overallSuccess,
    providers: results,
  }
}
