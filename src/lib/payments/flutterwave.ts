import { createServiceClient } from '@/lib/supabase/service'
import { type CustomerInfo } from '@/lib/actions/orders'
import { formatPrice } from '@/lib/utils/format'

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY
const FLW_PUBLIC_KEY = process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

interface InitiatePaymentInput {
  cartItems: Array<{ productId: string; quantity: number }>
  customerInfo: CustomerInfo
}

export interface PaymentInitiation {
  success: boolean
  paymentLink?: string
  orderId?: string
  guestToken?: string
  isMockPayment?: boolean
  error?: string
}

export async function createOrderWithoutPayment(
  input: InitiatePaymentInput
): Promise<PaymentInitiation> {
  const service = createServiceClient()

  const products = await Promise.all(
    input.cartItems.map(async (item) => {
      const { data, error } = await service
        .from('products')
        .select('id, name, price, stock_quantity, is_available, is_published')
        .eq('id', item.productId)
        .single()

      if (error || !data) return null
      return {
        id: (data as { id: string }).id,
        name: (data as { name: string }).name,
        price: Number((data as { price: string }).price),
        stock_quantity: (data as { stock_quantity: number }).stock_quantity,
        is_available: (data as { is_available: boolean }).is_available,
        is_published: (data as { is_published: boolean }).is_published,
      }
    })
  )

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    const cartItem = input.cartItems[i]

    if (!product) {
      return { success: false, error: 'One or more products in your cart are no longer available.' }
    }
    if (!product.is_published) {
      return { success: false, error: `${product.name} is no longer available.` }
    }
    if (!product.is_available) {
      return { success: false, error: `${product.name} is out of stock.` }
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
    const cartItem = input.cartItems[index]
    const unitPrice = product.price
    const quantity = cartItem.quantity
    return {
      product_id: product.id,
      product_name: product.name,
      product_price: unitPrice,
      quantity,
      total_price: unitPrice * quantity,
    }
  })

  const productSubtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0)

  if (!input.customerInfo.deliveryLocationId) {
    return { success: false, error: 'Please select a delivery location.' }
  }

  const { data: deliveryLoc } = await service
    .from('delivery_locations')
    .select('id, name, region, city, delivery_fee, estimated_delivery, is_active')
    .eq('id', input.customerInfo.deliveryLocationId)
    .single()

  if (!deliveryLoc) {
    return { success: false, error: 'Selected delivery location does not exist.' }
  }
  if (!deliveryLoc.is_active) {
    return { success: false, error: 'Selected delivery location is no longer available. Please choose another.' }
  }

  const deliveryFee = Number(deliveryLoc.delivery_fee)
  const total = productSubtotal + deliveryFee
  const guestAccessToken = crypto.randomUUID()

  const orderPayload: Record<string, unknown> = {
    profile_id: null,
    status: 'pending',
    payment_state: 'pending',
    total: String(total),
    currency: 'GHS',
    shipping_address: input.customerInfo.address.trim(),
    city: input.customerInfo.city.trim(),
    phone: input.customerInfo.phone.trim(),
    notes: input.customerInfo.notes?.trim() || null,
    delivery_location_id: input.customerInfo.deliveryLocationId,
    delivery_location_name: deliveryLoc.name,
    delivery_region: deliveryLoc.region,
    delivery_city: deliveryLoc.city,
    delivery_fee: deliveryFee,
    delivery_estimated: deliveryLoc.estimated_delivery,
    guest_access_token: guestAccessToken,
  }

  const { data: order, error: orderError } = await service
    .from('orders')
    .insert(orderPayload as never)
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

  const { error: itemsError } = await service.from('order_items').insert(itemsWithOrderId)

  if (itemsError) {
    console.error('Order items creation failed:', itemsError)
    await service.from('orders').delete().eq('id', orderId)
    return { success: false, error: 'Failed to create order items. Please try again.' }
  }

  // Deduct stock
  const stockResults = await Promise.all(
    validProducts.map(async (product, index) => {
      const { data, error: stockError } = await service.rpc('perform_stock_operation', {
        p_product_id: product.id,
        p_movement_type: 'SALE',
        p_quantity_change: -input.cartItems[index].quantity,
        p_reference_type: 'ORDER',
        p_reference_id: orderId,
      })

      if (stockError) return { success: false, error: stockError.message }
      const rows = data as Array<{ success: boolean; error: string | null }> | null
      const row = rows?.[0]
      if (!row?.success) return { success: false, error: row?.error || 'Stock update failed.' }
      return { success: true, error: null }
    })
  )

  const stockFailure = stockResults.find((r) => !r.success)
  if (stockFailure) {
    console.error('Stock deduction failed:', stockFailure.error)
    await service.from('orders').delete().eq('id', orderId)
    await service.from('order_items').delete().eq('order_id', orderId)
    return { success: false, error: stockFailure.error || 'Stock deduction failed. Please try again.' }
  }

  return {
    success: true,
    orderId,
    guestToken: guestAccessToken,
    isMockPayment: true,
    paymentLink: `${SITE_URL}/order-success/${orderId}?token=${guestAccessToken}`,
  }
}

export async function initiateFlutterwavePayment(
  input: InitiatePaymentInput
): Promise<PaymentInitiation> {
  if (!FLW_SECRET_KEY || !FLW_PUBLIC_KEY) {
    // Fallback: no payment gateway configured. Create order directly.
    // In production, set FLW_SECRET_KEY and NEXT_PUBLIC_FLW_PUBLIC_KEY to enable
    // real payment collection. This mode is for development/testing only.
    return createOrderWithoutPayment(input)
  }

  const service = createServiceClient()

  // Fetch products from the database to compute totals server-side
  const { data: products, error: productError } = await service
    .from('products')
    .select('id, name, price, stock_quantity, is_available, is_published')
    .in(
      'id',
      input.cartItems.map((item) => item.productId)
    )

  if (productError) {
    return { success: false, error: 'Failed to verify products in cart.' }
  }

  // Validate all products exist
  for (const cartItem of input.cartItems) {
    const product = (products || []).find((p) => (p as { id: string }).id === cartItem.productId)
    if (!product) {
      return { success: false, error: 'One or more products in your cart are no longer available.' }
    }
    const p = product as { is_published: boolean; is_available: boolean }
    if (!p.is_published) {
      return { success: false, error: 'One or more products are no longer available.' }
    }
    if (!p.is_available || (product as { stock_quantity: number }).stock_quantity < cartItem.quantity) {
      return { success: false, error: 'Insufficient stock for one or more products.' }
    }
  }

  // Fetch delivery location
  const { data: deliveryLoc } = await service
    .from('delivery_locations')
    .select('id, name, region, city, delivery_fee, estimated_delivery, is_active')
    .eq('id', input.customerInfo.deliveryLocationId || '')
    .single()

  if (!deliveryLoc || !deliveryLoc.is_active) {
    return { success: false, error: 'Selected delivery location is not available.' }
  }

  // Compute totals
  const productSubtotal = input.cartItems.reduce((sum, item) => {
    const product = (products || []).find((p) => (p as { id: string }).id === item.productId)
    if (!product) return sum
    return sum + Number((product as { price: string }).price) * item.quantity
  }, 0)

  const deliveryFee = Number(deliveryLoc.delivery_fee)
  const total = productSubtotal + deliveryFee

  // Create order record with payment_state = 'pending'
  const txRef = `OTAB-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  const guestToken = crypto.randomUUID()

  const orderPayload: Record<string, unknown> = {
    profile_id: null,
    status: 'pending',
    payment_state: 'pending',
    total: String(total),
    currency: 'GHS',
    shipping_address: input.customerInfo.address.trim(),
    city: input.customerInfo.city.trim(),
    phone: input.customerInfo.phone.trim(),
    notes: (input.customerInfo.notes?.trim() || null) + (input.customerInfo.notes ? '' : '') + `\ntx_ref: ${txRef}`,
    delivery_location_id: input.customerInfo.deliveryLocationId || null,
    delivery_location_name: deliveryLoc.name,
    delivery_region: deliveryLoc.region,
    delivery_city: deliveryLoc.city,
    delivery_fee: deliveryFee,
    delivery_estimated: deliveryLoc.estimated_delivery,
    guest_access_token: guestToken,
    payment_provider: 'flutterwave',
    payment_tx_ref: txRef,
  }

  const { data: order, error: orderError } = await service
    .from('orders')
    .insert(orderPayload as never)
    .select('id')
    .single()

  if (orderError || !order) {
    console.error('Order creation failed:', orderError)
    return { success: false, error: 'Failed to create order. Please try again.' }
  }

  const orderId = (order as { id: string }).id

  // Create order items
  const itemsWithOrderId = input.cartItems.map((item) => {
    const product = (products || []).find((p) => (p as { id: string }).id === item.productId)
    const productPrice = product ? Number((product as { price: string }).price) : 0
    return {
      order_id: orderId,
      product_id: item.productId,
      product_name: product ? (product as { name: string }).name : 'Unknown Product',
      product_price: String(productPrice),
      quantity: item.quantity,
      total_price: String(productPrice * item.quantity),
    }
  })

  const { error: itemsError } = await service.from('order_items').insert(itemsWithOrderId)

  if (itemsError) {
    console.error('Order items creation failed:', itemsError)
    await service.from('orders').delete().eq('id', orderId)
    return { success: false, error: 'Failed to create order items. Please try again.' }
  }

  // Deduct stock
  const stockResults = await Promise.all(
    input.cartItems.map(async (item) => {
      const { data, error: stockError } = await service.rpc('perform_stock_operation', {
        p_product_id: item.productId,
        p_movement_type: 'SALE',
        p_quantity_change: -item.quantity,
        p_reference_type: 'ORDER',
        p_reference_id: orderId,
      })

      if (stockError) return { success: false, error: stockError.message }
      const rows = data as Array<{ success: boolean; error: string | null }> | null
      const row = rows?.[0]
      if (!row?.success) return { success: false, error: row?.error || 'Stock update failed.' }
      return { success: true, error: null }
    })
  )

  const stockFailure = stockResults.find((r) => !r.success)
  if (stockFailure) {
    console.error('Stock deduction failed:', stockFailure.error)
    await service.from('orders').delete().eq('id', orderId)
    await service.from('order_items').delete().eq('order_id', orderId)
    return { success: false, error: stockFailure.error || 'Stock deduction failed.' }
  }

  // Create Flutterwave payment link
  const paymentRes = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${FLW_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tx_ref: txRef,
      amount: total,
      currency: 'GHS',
      redirect_url: `${SITE_URL}/checkout/complete?tx_ref=${txRef}&order_id=${orderId}`,
      customer: {
        email: input.customerInfo.email,
        phone_number: input.customerInfo.phone,
        name: input.customerInfo.fullName,
      },
      meta: {
        order_id: orderId,
        customer_name: input.customerInfo.fullName,
        delivery_location: input.customerInfo.deliveryLocationId,
      },
      customizations: {
        title: 'OtabilHub Order',
        logo: `${SITE_URL}/favicon.svg`,
        description: `Order #${orderId.slice(0, 8).toUpperCase()} — ${formatPrice(total)}`,
      },
      Meta: {
        order_id: orderId,
        customer_name: input.customerInfo.fullName,
      },
    }),
  })

  const paymentData = await paymentRes.json()

  if (!paymentRes.ok || !paymentData.data?.link) {
    console.error('Flutterwave payment initiation failed:', paymentData)
    await service.from('orders').delete().eq('id', orderId)
    await service.from('order_items').delete().eq('order_id', orderId)
    return {
      success: false,
      error: paymentData.message || 'Failed to initialize payment. Please try again.',
    }
  }

  return {
    success: true,
    orderId,
    guestToken,
    paymentLink: paymentData.data.link,
  }
}

export async function verifyFlutterwavePayment(txRef: string): Promise<{
  success: boolean
  status?: string
  amount?: number
  error?: string
}> {
  if (!FLW_SECRET_KEY) {
    return { success: false, error: 'Payment gateway not configured.' }
  }

  const res = await fetch(`https://api.flutterwave.com/v3/payments/${txRef}/verify`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${FLW_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  })

  const data = await res.json()

  if (!res.ok) {
    return { success: false, error: data.message || 'Payment verification failed.' }
  }

  return {
    success: true,
    status: data.data?.status,
    amount: data.data?.amount,
  }
}

export async function updatePaymentState(
  orderId: string,
  paymentState: 'pending' | 'paid' | 'failed',
  txRef?: string
): Promise<{ success: boolean; error?: string }> {
  const service = createServiceClient()

  const { error } = await service
    .from('orders')
    .update({ payment_state: paymentState } as never)
    .eq('id', orderId)

  if (error) {
    console.error('Payment state update failed:', error)
    return { success: false, error: 'Failed to update payment state.' }
  }

  return { success: true }
}
