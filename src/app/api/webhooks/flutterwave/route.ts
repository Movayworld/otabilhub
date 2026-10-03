import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifyFlutterwavePayment, updatePaymentState } from '@/lib/payments/flutterwave'
import { revalidatePath } from 'next/cache'

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY
const FLW_WEBHOOK_HASH = process.env.FLW_WEBHOOK_HASH

export async function POST(request: NextRequest) {
  if (!FLW_SECRET_KEY) {
    console.warn('Flutterwave webhook: FLW_SECRET_KEY not set')
    return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 })
  }

  const body = await request.json()
  const signature = request.headers.get('verif-hash')

  if (FLW_WEBHOOK_HASH && signature !== FLW_WEBHOOK_HASH) {
    console.warn('Flutterwave webhook: Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const { event, data } = body

  if (!event || !data) {
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
  }

  const service = createServiceClient()
  const orderId = data.meta?.order_id || data.customers?.meta?.order_id

  if (!orderId) {
    console.warn('Flutterwave webhook: No order_id in payload')
    return NextResponse.json({ error: 'No order ID' }, { status: 400 })
  }

  const txRef = data.tx_ref

  const verification = await verifyFlutterwavePayment(txRef)

  if (!verification.success) {
    console.error('Payment verification failed:', verification.error)
    await updatePaymentState(orderId, 'failed', txRef)
    return NextResponse.json({ ok: true })
  }

  const status = verification.status
  const paymentState = status === 'successful' ? 'paid' : status === 'failed' ? 'failed' : 'pending'

  const result = await updatePaymentState(orderId, paymentState as 'pending' | 'paid' | 'failed', txRef)

  if (result.success && paymentState === 'paid') {
    const { data: order } = await service
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .single()

    if (order && order.status === 'pending') {
      await service
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', orderId)
    }

    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${orderId}`)

    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/orders/${orderId}/send-receipt`, {
        method: 'POST',
      })
    } catch {
      // Non-blocking - email sending may not be configured
    }
  }

  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({ ok: true, message: 'Flutterwave webhook endpoint' })
}
