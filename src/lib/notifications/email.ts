import type { Transporter } from 'nodemailer'
import { createTransport } from 'nodemailer'
import type { OrderNotificationData, NotificationResult, NotificationChannel } from './types'
import { formatPrice } from '@/lib/utils/format'

const GHS = (n: number) =>
  new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 2 }).format(n)

export async function sendOrderEmail(
  order: OrderNotificationData
): Promise<{ success: boolean; error?: string }> {
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const fromEmail = process.env.SMTP_FROM || smtpUser
  const adminEmail = process.env.NOTIFICATION_ADMIN_EMAIL

  if (!smtpHost || !smtpUser || !smtpPass || !adminEmail) {
    console.warn('Email notification skipped: SMTP credentials or admin email not configured')
    return { success: true, error: undefined }
  }

  let transporter: Transporter
  try {
    transporter = createTransport({
      host: smtpHost,
      port: smtpPort || 587,
      secure: smtpPort ? smtpPort === 465 : false,
      auth: { user: smtpUser, pass: smtpPass },
    })
  } catch (err) {
    return { success: false, error: `Failed to create email transporter: ${err}` }
  }

  const itemsTable = order.items
    .map(
      (item) =>
        `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product_name}</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${GHS(item.product_price)}</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${GHS(item.total_price)}</td></tr>`
    )
    .join('')

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>New Order #${order.orderNumber}</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a1a1a;">New Order Received</h1>
  <p><strong>Order:</strong> #${order.orderNumber}</p>
  <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>

  <h2 style="color: #333;">Customer Information</h2>
  <p><strong>Name:</strong> ${order.customerName}</p>
  <p><strong>Email:</strong> ${order.customerEmail}</p>
  <p><strong>Phone:</strong> ${order.customerPhone}</p>
  <p><strong>Address:</strong> ${order.shippingAddress}, ${order.city}</p>

  ${order.deliveryLocationName ? `<p><strong>Delivery:</strong> ${order.deliveryLocationName}</p>` : ''}

  <h2 style="color: #333;">Order Items</h2>
  <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr style="background: #f5f5f5;">
        <th style="padding: 8px; text-align: left;">Product</th>
        <th style="padding: 8px; text-align: center;">Qty</th>
        <th style="padding: 8px; text-align: right;">Price</th>
        <th style="padding: 8px; text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>${itemsTable}</tbody>
  </table>

  <div style="margin-top: 20px; text-align: right;">
    <p>Subtotal: ${GHS(order.total - order.deliveryFee)}</p>
    <p>Delivery Fee: ${GHS(order.deliveryFee)}</p>
    <p><strong>Total: ${GHS(order.total)}</strong></p>
  </div>
</body>
</html>`

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: adminEmail,
      subject: `New Order #${order.orderNumber} - ${GHS(order.total)}`,
      html,
    })
    return { success: true }
  } catch (err) {
    return { success: false, error: `Email send failed: ${err}` }
  }
}

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

export async function sendStatusUpdateEmail(
  order: OrderNotificationData,
  oldStatus: string,
  newStatus: string
): Promise<{ success: boolean; error?: string }> {
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const fromEmail = process.env.SMTP_FROM || smtpUser
  const customerEmail = order.customerEmail

  if (!smtpHost || !smtpUser || !smtpPass || !customerEmail) {
    return { success: true, error: undefined }
  }

  let transporter: Transporter
  try {
    transporter = createTransport({
      host: smtpHost,
      port: smtpPort || 587,
      secure: smtpPort ? smtpPort === 465 : false,
      auth: { user: smtpUser, pass: smtpPass },
    })
  } catch (err) {
    return { success: false, error: `Failed to create email transporter: ${err}` }
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Order Status Update</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a1a1a;">Order Status Updated</h1>
  <p>Your order <strong>#${order.orderNumber}</strong> has been updated.</p>
  <p><strong>Previous status:</strong> ${statusLabels[oldStatus] || oldStatus}</p>
  <p><strong>New status:</strong> ${statusLabels[newStatus] || newStatus}</p>
  <p>You can track your order at: ${process.env.NEXT_PUBLIC_SITE_URL}/order-success/${order.orderId}</p>
</body>
</html>`

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: customerEmail,
      subject: `Order #${order.orderNumber} Status Update`,
      html,
    })
    return { success: true }
  } catch (err) {
    return { success: false, error: `Email send failed: ${err}` }
  }
}
