import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email } = body

  if (!email || typeof email !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Email address is required.' },
      { status: 400 }
    )
  }

  const trimmedEmail = email.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmedEmail)) {
    return NextResponse.json(
      { success: false, error: 'Please enter a valid email address.' },
      { status: 400 }
    )
  }

  const service = createServiceClient()

  const { data: existing, error: existingError } = await service
    .from('newsletter_subscribers')
    .select('id, is_active')
    .eq('email', trimmedEmail)
    .single()

  if (existing && existing.is_active) {
    return NextResponse.json(
      { success: false, error: 'This email is already subscribed.' },
      { status: 409 }
    )
  }

  if (existing && !existing.is_active) {
    const { error: updateError } = await service
      .from('newsletter_subscribers')
      .update({ is_active: true })
      .eq('id', existing.id)

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to subscribe. Please try again.' },
        { status: 500 }
      )
    }

    await sendWelcomeEmail(trimmedEmail)

    return NextResponse.json({ success: true, error: null })
  }

  const { error } = await service
    .from('newsletter_subscribers')
    .insert({ email: trimmedEmail, is_active: true })

  if (error) {
    console.error('Newsletter subscription failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    )
  }

  await sendWelcomeEmail(trimmedEmail)

  return NextResponse.json({ success: true, error: null })
}

async function sendWelcomeEmail(to: string): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY

  if (!resendKey) {
    console.warn('RESEND_API_KEY not configured; skipping welcome email')
    return
  }

  try {
    const resend = new Resend(resendKey)

    await resend.emails.send({
      from: 'OtabilHub <shop@otabilhub.com>',
      to: [to],
      subject: 'Welcome to OtabilHub!',
      html: `
        <p>Thank you for subscribing to OtabilHub!</p>
        <p>You'll now receive updates on new products, installation services, and special offers.</p>
        <p>If you didn't subscribe to our newsletter, you can safely ignore this email.</p>
        <hr />
        <p><small>OtabilHub — Premium electronics, technology, and smart-home products.</small></p>
      `,
    })
  } catch (err) {
    console.error('Failed to send welcome email:', err)
  }
}
