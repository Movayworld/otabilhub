'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'

export interface NewsletterFormData {
  email: string
}

export async function subscribeNewsletter(
  data: NewsletterFormData
): Promise<{ success: boolean; error: string | null }> {
  if (!data.email) {
    return { success: false, error: 'Email address is required.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.email.trim())) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  const supabase = createServiceClient()

  const { data: existing, error: existingError } = await supabase
    .from('newsletter_subscribers')
    .select('id, is_active')
    .eq('email', data.email.trim().toLowerCase())
    .maybeSingle()

  if (existing && existing.is_active) {
    return { success: false, error: 'This email is already subscribed.' }
  }

  if (existing && !existing.is_active) {
    const { error: updateError } = await supabase
      .from('newsletter_subscribers')
      .update({ is_active: true } as never)
      .eq('id', existing.id)

    if (updateError) {
      console.error('Newsletter reactivation failed:', updateError)
      return { success: false, error: 'Failed to subscribe. Please try again.' }
    }

    revalidatePath('/')

    await sendWelcomeEmail(data.email.trim().toLowerCase())

    return { success: true, error: null }
  }

  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert({
      email: data.email.trim().toLowerCase(),
      is_active: true,
    } as never)

  if (error) {
    console.error('Newsletter subscription failed:', error)
    return { success: false, error: 'Failed to subscribe. Please try again.' }
  }

  revalidatePath('/')

  await sendWelcomeEmail(data.email.trim().toLowerCase())

  return { success: true, error: null }
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
