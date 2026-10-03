import type { OrderNotificationData } from './types'

export async function sendOrderSms(
  order: OrderNotificationData
): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_SID
  const authToken = process.env.TWILIO_TOKEN
  const fromNumber = process.env.TWILIO_FROM
  const adminPhone = process.env.NOTIFICATION_ADMIN_PHONE

  if (!accountSid || !authToken || !fromNumber || !adminPhone) {
    console.warn('SMS notification skipped: Twilio credentials or admin phone not configured')
    return { success: true, error: undefined }
  }

  const GHS = (n: number) =>
    new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 2 }).format(n)

  const message = `New order #${order.orderNumber}: ${GHS(order.total)} from ${order.customerName} (${order.customerPhone}). Items: ${order.itemCount}. View: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders/${order.orderId}`

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: adminPhone,
          Body: message,
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      return { success: false, error: `Twilio API error: ${res.status} ${err}` }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: `SMS send failed: ${err}` }
  }
}

export async function sendStatusUpdateSms(
  order: OrderNotificationData,
  oldStatus: string,
  newStatus: string
): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_SID
  const authToken = process.env.TWILIO_TOKEN
  const fromNumber = process.env.TWILIO_FROM
  const customerPhone = order.customerPhone

  if (!accountSid || !authToken || !fromNumber || !customerPhone) {
    return { success: true, error: undefined }
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }

  const message = `Your order #${order.orderNumber} status changed from ${statusLabels[oldStatus] || oldStatus} to ${statusLabels[newStatus] || newStatus}. Track: ${process.env.NEXT_PUBLIC_SITE_URL}/order-success/${order.orderId}`

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: customerPhone,
          Body: message,
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      return { success: false, error: `Twilio API error: ${res.status} ${err}` }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: `SMS send failed: ${err}` }
  }
}
