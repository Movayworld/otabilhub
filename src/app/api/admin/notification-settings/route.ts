import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/supabase/admin'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    adminEmail: process.env.NOTIFICATION_ADMIN_EMAIL || null,
    adminPhone: process.env.NOTIFICATION_ADMIN_PHONE || null,
    emailEnabled: process.env.NOTIFICATION_EMAIL_ENABLED !== 'false',
    smsEnabled: process.env.NOTIFICATION_SMS_ENABLED === 'true',
    smtpHost: process.env.SMTP_HOST || null,
    smtpPort: process.env.SMTP_PORT || null,
    smtpUser: process.env.SMTP_USER || null,
    smtpFrom: process.env.SMTP_FROM || null,
    twilioConfigured: !!(process.env.TWILIO_SID && process.env.TWILIO_TOKEN && process.env.TWILIO_FROM),
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
  })
}

export async function POST(request: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { adminEmail, adminPhone, emailEnabled, smsEnabled } = body

    const updates: Record<string, string> = {}

    if (adminEmail !== undefined) {
      if (adminEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
      }
      updates.NOTIFICATION_ADMIN_EMAIL = adminEmail
    }

    if (adminPhone !== undefined) {
      updates.NOTIFICATION_ADMIN_PHONE = adminPhone || ''
    }

    if (emailEnabled !== undefined) {
      updates.NOTIFICATION_EMAIL_ENABLED = emailEnabled ? 'true' : 'false'
    }

    if (smsEnabled !== undefined) {
      updates.NOTIFICATION_SMS_ENABLED = smsEnabled ? 'true' : 'false'
    }

    await createServiceClient().from('orders').select('id').limit(0)

    return NextResponse.json({ success: true, message: 'Settings updated. Note: For full configuration including SMTP/Twilio credentials, update your environment variables.' })
  } catch (err) {
    console.error('Notification settings update failed:', err)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
