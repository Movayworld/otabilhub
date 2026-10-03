export interface OrderNotificationData {
  orderId: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: string
  city: string
  total: number
  currency: string
  itemCount: number
  deliveryLocationName: string
  deliveryFee: number
  createdAt: string
  items: Array<{
    product_name: string
    product_price: number
    quantity: number
    total_price: number
  }>
}

export type NotificationChannel = 'email' | 'sms' | 'both'

export interface NotificationResult {
  success: boolean
  error?: string
  providers: Array<{
    channel: NotificationChannel
    status: 'sent' | 'failed' | 'skipped'
    error?: string
  }>
}
