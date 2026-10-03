import { NextRequest, NextResponse } from 'next/server'
import { initiateFlutterwavePayment } from '@/lib/payments/flutterwave'
import type { CustomerInfo } from '@/lib/actions/orders'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cartItems, customerInfo }: {
      cartItems: Array<{ productId: string; quantity: number }>
      customerInfo: CustomerInfo
    } = body

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Your cart is empty.' },
        { status: 400 }
      )
    }

    const result = await initiateFlutterwavePayment({ cartItems, customerInfo })

    if (result.success) {
      return NextResponse.json({
        success: true,
        paymentLink: result.paymentLink,
        orderId: result.orderId,
        guestToken: result.guestToken,
        isMockPayment: result.isMockPayment,
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to initialize payment.' },
        { status: 400 }
      )
    }
  } catch (err) {
    console.error('Payment initiation error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
