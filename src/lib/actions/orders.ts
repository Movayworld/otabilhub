'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { notifyNewOrder } from '@/lib/notifications'

export interface CartItemForCheckout {
  productId: string
  quantity: number
}

export interface CustomerInfo {
  fullName: string
  phone: string
  email: string
  address: string
  city: string
  notes?: string
  deliveryLocationId?: string | null
}

export interface OrderResult {
  success: boolean
  orderId?: string
  guestToken?: string
  error?: string
}

const MIN_NAME_LENGTH = 2
const MAX_NAME_LENGTH = 100
const MIN_PHONE_LENGTH = 7
const MAX_PHONE_LENGTH = 20
const MAX_EMAIL_LENGTH = 254
const MAX_ADDRESS_LENGTH = 500
const MAX_NOTES_LENGTH = 1000

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export async function createOrder(
  cartItems: CartItemForCheckout[],
  customerInfo: CustomerInfo,
  profileId?: string | null
): Promise<OrderResult> {
  if (!cartItems || cartItems.length === 0) {
    return { success: false, error: 'Your cart is empty.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let authenticatedProfileId: string | null = profileId || null

  if (user) {
    authenticatedProfileId = user.id
  } else {
    authenticatedProfileId = null
  }

  const service = createServiceClient()

  const products = await Promise.all(
    cartItems.map(async (item) => {
      const { data, error } = await service
        .from('products')
        .select('id, name, price, stock_quantity, is_available, is_published, category:category_id(id, name, slug)')
        .eq('id', item.productId)
        .single()

      if (error || !data) {
        return null
      }

      const rawCategory = (data as { category?: unknown }).category
      const category = Array.isArray(rawCategory)
        ? rawCategory[0] as { id: string; name: string; slug: string } | undefined
        : (rawCategory as { id: string; name: string; slug: string } | null | undefined)

      return {
        id: (data as { id: string }).id,
        name: (data as { name: string }).name,
        price: Number((data as { price: string }).price),
        stock_quantity: (data as { stock_quantity: number }).stock_quantity,
        is_available: (data as { is_available: boolean }).is_available,
        is_published: (data as { is_published: boolean }).is_published,
        category: category ?? null,
      }
    })
  )

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    const cartItem = cartItems[i]

    if (!product) {
      return {
        success: false,
        error: 'One or more products in your cart are no longer available.',
      }
    }

    if (!product.is_published) {
      return {
        success: false,
        error: `${product.name} is no longer available.`,
      }
    }

    if (!product.is_available) {
      return {
        success: false,
        error: `${product.name} is out of stock.`,
      }
    }

    if (product.stock_quantity < cartItem.quantity) {
      return {
        success: false,
        error: `${product.name} no longer has sufficient stock for the requested quantity.`,
      }
    }
  }

  const validProducts = products.filter((p): p is NonNullable<typeof p> => p !== null)

  const orderItems = validProducts.map((product, index) => {
    const cartItem = cartItems[index]
    const unitPrice = product.price
    const quantity = cartItem.quantity
    const totalPrice = unitPrice * quantity

    return {
      product_id: product.id,
      product_name: product.name,
      product_price: unitPrice,
      quantity,
      total_price: totalPrice,
    }
  })

  const productSubtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0)

  if (!customerInfo.deliveryLocationId) {
    return { success: false, error: 'Please select a delivery location.' }
  }

  const { data: deliveryLoc } = await service
    .from('delivery_locations')
    .select('id, name, region, city, delivery_fee, estimated_delivery, is_active')
    .eq('id', customerInfo.deliveryLocationId)
    .single()

  if (!deliveryLoc) {
    return { success: false, error: 'Selected delivery location does not exist.' }
  }

  if (!deliveryLoc.is_active) {
    return { success: false, error: 'Selected delivery location is no longer available. Please choose another.' }
  }

  const deliveryFee = Number(deliveryLoc.delivery_fee)
  const deliveryLocationName: string = deliveryLoc.name
  const deliveryRegion: string = deliveryLoc.region
  const deliveryCity: string = deliveryLoc.city
  const deliveryEstimated: string = deliveryLoc.estimated_delivery

  const total = productSubtotal + deliveryFee

  try {
    let guestAccessToken: string | null = null

    if (!authenticatedProfileId) {
      // gen_random_uuid() is not reachable through PostgREST (it lives in
      // pg_catalog/extensions, not public), so generate the token locally.
      guestAccessToken = crypto.randomUUID()
    }

    const insertPayload: Record<string, unknown> = {
      profile_id: authenticatedProfileId,
      status: 'pending',
      payment_state: 'pending',
      total: String(total),
      currency: 'GHS',
      shipping_address: customerInfo.address.trim(),
      city: customerInfo.city.trim(),
      phone: customerInfo.phone.trim(),
      notes: customerInfo.notes?.trim() || null,
      delivery_location_id: customerInfo.deliveryLocationId,
      delivery_location_name: deliveryLocationName,
      delivery_region: deliveryRegion,
      delivery_city: deliveryCity,
      delivery_fee: deliveryFee,
      delivery_estimated: deliveryEstimated,
    }

    if (guestAccessToken) {
      insertPayload.guest_access_token = guestAccessToken
    } else {
      insertPayload.guest_access_token = null
    }

    const { data: order, error: orderError } = await service
      .from('orders')
      .insert(insertPayload)
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('Order creation failed:', orderError)
      return { success: false, error: 'Failed to create order. Please try again.' }
    }

    const orderId = (order as { id: string }).id

    const itemsWithOrderId = orderItems.map((item) => ({
      order_id: orderId,
      product_id: item.product_id,
      product_name: item.product_name,
      product_price: String(item.product_price),
      quantity: item.quantity,
      total_price: String(item.total_price),
    }))

    const { error: itemsError } = await service
      .from('order_items')
      .insert(itemsWithOrderId)

    if (itemsError) {
      console.error('Order items creation failed:', itemsError)
      await service.from('orders').delete().eq('id', orderId)
      return {
        success: false,
        error: 'Failed to create order items. Please try again.',
      }
    }

    const stockResults = await Promise.all(
      validProducts.map(async (product, index) => {
        const { data, error: stockError } = await service.rpc('perform_stock_operation', {
          p_product_id: product.id,
          p_movement_type: 'SALE',
          p_quantity_change: -(cartItems[index].quantity),
          p_reference_type: 'ORDER',
          p_reference_id: orderId,
        })

        if (stockError) {
          return { success: false, error: stockError.message }
        }

        const rows = data as Array<{ success: boolean; error: string | null }> | null
        const row = rows?.[0]
        if (!row?.success) {
          return { success: false, error: row?.error || 'Stock update failed.' }
        }
        return { success: true, error: null }
      })
    )

    const stockFailure = stockResults.find((r) => !r.success)
    if (stockFailure) {
      console.error('Stock deduction failed:', stockFailure.error)
      await service.from('orders').delete().eq('id', orderId)
      await service.from('order_items').delete().eq('order_id', orderId)
      return {
        success: false,
        error: stockFailure.error || 'Stock deduction failed. Please try again.',
      }
    }

    const notificationResult = await notifyNewOrder(orderId)
    if (!notificationResult.success) {
      console.error('Order notification failed:', notificationResult.providers)
    }

    return {
      success: true,
      orderId,
      ...(guestAccessToken ? { guestToken: guestAccessToken } : {}),
    }
  } catch (err) {
    console.error('Unexpected error during order creation:', err)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

async function updatePaymentStateInternal(
  orderId: string,
  paymentState: string,
  guestToken?: string | null
): Promise<{ success: boolean; error: string | null }> {
  const service = createServiceClient()

  const { error } = await service
    .from('orders')
    .update({ payment_state: paymentState })
    .eq('id', orderId)

  if (error) {
    console.error('Payment state update failed:', error)
    return { success: false, error: 'Failed to update payment state.' }
  }

  return { success: true, error: null }
}

const CANCELLED_STATUSES = ['cancelled', 'completed']

export async function cancelOrder(
  orderId: string,
  guestToken?: string | null
): Promise<{ success: boolean; error: string | null }> {
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()

  const service = createServiceClient()

  const { data: order, error: fetchError } = await service
    .from('orders')
    .select('id, status, profile_id, guest_access_token, order_items(product_id, quantity, product_name)')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) {
    return { success: false, error: 'Order not found.' }
  }

  if (user) {
    if (order.profile_id !== user.id) {
      return { success: false, error: 'Unauthorized.' }
    }
  } else if (guestToken) {
    if (order.guest_access_token?.toString() !== guestToken) {
      return { success: false, error: 'Unauthorized.' }
    }
  } else {
    return { success: false, error: 'Unauthorized.' }
  }

  if (CANCELLED_STATUSES.includes(order.status)) {
    return { success: false, error: `Order cannot be cancelled (status: ${order.status}).` }
  }

  for (const item of order.order_items as Array<{ product_id: string; quantity: number; product_name: string }>) {
    const { data, error: stockError } = await service.rpc('perform_stock_operation', {
      p_product_id: item.product_id,
      p_movement_type: 'CANCELLATION_RESTOCK',
      p_quantity_change: item.quantity,
      p_reason: `Order ${orderId.slice(0, 8).toUpperCase()} cancelled by user`,
      p_reference_type: 'ORDER',
      p_reference_id: orderId,
      p_notes: `Restoring stock for ${item.product_name}`,
      p_created_by: user?.id || null,
    })

    if (stockError) {
      return { success: false, error: 'Failed to restore stock. Please try again.' }
    }

    const rows = data as Array<{ success: boolean; error: string | null }> | null
    const row = rows?.[0]
    if (!row?.success) {
      return { success: false, error: row?.error || 'Failed to restore stock.' }
    }
  }

  const { error: statusError } = await service
    .from('orders')
    .update({ status: 'cancelled' } as never)
    .eq('id', orderId)

  if (statusError) {
    console.error('Order cancellation failed:', statusError)
    return { success: false, error: 'Failed to cancel order.' }
  }

  revalidatePath('/account/orders')
  revalidatePath(`/account/orders/${orderId}`)
  revalidatePath(`/order-success/${orderId}`)
  return { success: true, error: null }
}
