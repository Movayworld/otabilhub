import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getCurrentUser } from '@/lib/supabase/auth'
import { Container } from '@/components/layout/container'
import { Section } from '@/components/ui/section'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import CancelOrderButton from '@/components/cancel-order-button'

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
  }).format(price)
}

async function getOrder(id: string, guestToken: string | null) {
  const user = await getCurrentUser()

  if (user) {
    const supabase = await createClient()
    const { data: order, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        order_items(*)
        `
      )
      .eq('id', id)
      .eq('profile_id', user.id)
      .is('guest_access_token', null)
      .single()

    if (error || !order) {
      return null
    }

    return order as unknown as {
      id: string
      status: string
      payment_state: string
      total: string
      currency: string
      shipping_address: string | null
      city: string | null
      phone: string | null
      notes: string | null
      delivery_location_name: string | null
      delivery_region: string | null
      delivery_city: string | null
      delivery_fee: number
      delivery_estimated: string
      created_at: string
      order_items: Array<{
        id: string
        product_id: string | null
        product_name: string
        product_price: string
        quantity: number
        total_price: string
      }>
    }
  }

  if (!guestToken) {
    return null
  }

  const service = await createServiceClient()
  const { data: order, error } = await service
    .from('orders')
    .select(
      `
      *,
      order_items(*)
      `
    )
    .eq('id', id)
    .eq('guest_access_token', guestToken)
    .single()

  if (error || !order) {
    return null
  }

  return order as unknown as {
    id: string
    status: string
    payment_state: string
    total: string
    currency: string
    shipping_address: string | null
    city: string | null
    phone: string | null
    notes: string | null
    delivery_location_name: string | null
    delivery_region: string | null
    delivery_city: string | null
    delivery_fee: number
    delivery_estimated: string
    created_at: string
    order_items: Array<{
      id: string
      product_id: string | null
      product_name: string
      product_price: string
      quantity: number
      total_price: string
    }>
  }
}

function formatOrderId(id: string): string {
  return `#OTB-${id.slice(0, 8).toUpperCase()}`
}

export default async function OrderSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string | undefined }>
}) {
  const { id } = await params
  const sp = await searchParams
  const order = await getOrder(id, sp.token ?? null)

  if (!order) {
    notFound()
  }

  const orderItems = order.order_items || []
  const orderTotal = Number(order.total)
  const orderDate = new Date(order.created_at).toLocaleDateString('en-GH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }

  return (
    <Section className="py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <CheckCircle2 size={56} className="text-green-600" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Order received
          </h1>

          <p className="mt-4 max-w-md text-gray-600 mx-auto">
            Thank you for your order. We have received your order and will
            process it as soon as possible. A confirmation email will be sent
            shortly.
          </p>
        </div>

           <div className="mt-12 max-w-2xl mx-auto">
           <div className="border border-gray-200 bg-gray-50 p-6">
             <div className="flex justify-between">
               <div>
                 <p className="text-sm text-gray-500">Order reference</p>
                 <p className="font-medium text-gray-900">{formatOrderId(order.id)}</p>
               </div>
               <div>
                 <p className="text-sm text-gray-500">Date</p>
                 <p className="font-medium text-gray-900">{orderDate}</p>
               </div>
               <div>
                 <p className="text-sm text-gray-500">Status</p>
                 <p className="font-medium text-gray-900 capitalize">
                   {statusLabels[order.status] || order.status}
                 </p>
               </div>
               <div>
                 <p className="text-sm text-gray-500">Payment</p>
                 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.payment_state === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                   {order.payment_state}
                 </span>
               </div>
             </div>

            <div className="mt-6 border-t border-gray-200 pt-4">
              <ul className="space-y-3">
                {orderItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-gray-600">
                      {item.product_name} x {item.quantity}
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(Number(item.total_price))}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-lg font-medium">
                  <span>Total</span>
                  <span>{formatPrice(orderTotal)}</span>
                </div>
              </div>
            </div>

            {order.shipping_address && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500">Shipping to</p>
                <p className="text-sm text-gray-900">{order.shipping_address}</p>
                {order.city && (
                  <p className="text-sm text-gray-900">{order.city}</p>
                )}
              </div>
            )}

            {order.delivery_location_name && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500">Delivery Location</p>
                <p className="text-sm font-medium text-gray-900">{order.delivery_location_name}</p>
                {order.delivery_region && (
                  <p className="text-sm text-gray-900">{order.delivery_region}</p>
                )}
                {order.delivery_city && (
                  <p className="text-sm text-gray-900">{order.delivery_city}</p>
                )}
                {order.delivery_estimated && (
                  <p className="text-sm text-gray-600">Est: {order.delivery_estimated}</p>
                )}
                <p className="text-sm font-medium text-gray-900">Delivery: {formatPrice(Number(order.delivery_fee || 0))}</p>
              </div>
            )}

            {order.phone && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-sm text-gray-900">{order.phone}</p>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/shop">
              <Button variant="primary">
                <ShoppingBag size={16} className="mr-2" />
                Continue Shopping
              </Button>
            </Link>
            {order.status !== 'completed' && order.status !== 'cancelled' && (
              <CancelOrderButton orderId={order.id} guestToken={sp.token ?? null} />
            )}
          </div>
        </div>
      </Container>
    </Section>
  )
}
