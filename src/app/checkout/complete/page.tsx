import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { verifyFlutterwavePayment, updatePaymentState } from '@/lib/payments/flutterwave'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
  }).format(price)
}

interface OrderDetails {
  id: string
  total: string
  currency: string
  status: string
  payment_state: string
  delivery_location_name: string | null
  delivery_fee: string | null
  created_at: string
  guest_access_token: string | null
  order_items: Array<{
    product_name: string
    product_price: string
    quantity: number
    total_price: string
  }>
}

async function verifyAndComplete(txRef: string, orderId?: string): Promise<OrderDetails | { error: string }> {
  const service = createServiceClient()

  if (!txRef) {
    return { error: 'Missing transaction reference.' }
  }

  const verification = await verifyFlutterwavePayment(txRef)

  if (!verification.success) {
    return { error: verification.error || 'Payment verification failed.' }
  }

  if (orderId) {
    const paymentState = verification.status === 'successful' ? 'paid' : 'failed'
    await updatePaymentState(orderId, paymentState as 'pending' | 'paid' | 'failed', txRef)

    if (paymentState === 'paid') {
      await service
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', orderId)

      revalidatePath('/admin/orders')
      revalidatePath(`/admin/orders/${orderId}`)
      revalidatePath('/account/orders')
    }
  }

  if (!orderId) {
    return { error: 'Order ID not provided.' }
  }

  const { data: order, error } = await service
    .from('orders')
    .select(
      `id, total, currency, status, payment_state, delivery_location_name, delivery_fee, created_at, guest_access_token,
       order_items(id, product_name, product_price, quantity, total_price)`
    )
    .eq('id', orderId)
    .single()

  if (error || !order) {
    return { error: 'Order not found.' }
  }

  return order as unknown as OrderDetails
}

export default async function CheckoutCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ tx_ref?: string; order_id?: string; status?: string }>
}) {
  const params = await searchParams
  const txRef = params.tx_ref
  const orderId = params.order_id
  const flutterwaveStatus = params.status

  const order = await verifyAndComplete(txRef || '', orderId)

  if ('error' in order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle size={32} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Issue</h1>
          <p className="text-gray-600 mb-6">{order.error}</p>
          <Link href="/shop">
            <span className="text-green-600 hover:text-green-700 font-medium">Continue shopping</span>
          </Link>
        </div>
      </div>
    )
  }

  const paymentConfirmed = order.payment_state === 'paid' && order.status === 'confirmed'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="mb-8 flex items-center justify-center">
            {paymentConfirmed ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <div className="ml-4 text-left">
                  <h1 className="text-2xl font-bold text-gray-900">Payment Successful!</h1>
                  <p className="text-gray-600">Your order has been confirmed.</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                  <AlertCircle size={32} className="text-yellow-600" />
                </div>
                <div className="ml-4 text-left">
                  <h1 className="text-2xl font-bold text-gray-900">Payment Pending</h1>
                  <p className="text-gray-600">
                    Your payment is being processed. You'll receive an email confirmation shortly.
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Number</span>
              <span className="font-medium text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Order Date</span>
              <span className="font-medium text-gray-900">
                {new Date(order.created_at).toLocaleDateString('en-GH', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Status</span>
              <span className="font-medium text-green-600 uppercase">{order.payment_state}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Order Status</span>
              <span className="font-medium text-gray-900 capitalize">{order.status}</span>
            </div>
            {order.delivery_location_name && (
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery</span>
                <span className="font-medium text-gray-900">{order.delivery_location_name}</span>
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-3">
              {(order.order_items || []).map((item) => (
                <div key={item.product_name} className="flex justify-between">
                  <span className="text-gray-600">{item.product_name} × {item.quantity}</span>
                  <span className="font-medium text-gray-900">{formatPrice(Number(item.total_price))}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-medium">
                <span>Total</span>
                <span>{formatPrice(Number(order.total))}</span>
              </div>
            </div>
          </div>

          {order.guest_access_token && (
            <div className="mt-6 bg-gray-50 rounded-md p-4">
              <p className="text-sm text-gray-600">
                Save this link to track your order:
              </p>
              <p className="text-xs text-gray-500 break-all mt-1">
                {process.env.NEXT_PUBLIC_SITE_URL}/order-success/{order.id}?token={order.guest_access_token}
              </p>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link href="/shop">
              <span className="text-sm font-medium text-green-600 hover:text-green-700">
                Continue shopping
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
