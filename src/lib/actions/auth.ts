'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

type SignUpInput = {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  phone?: string
}

type SignInInput = {
  email: string
  password: string
}

type UpdateProfileInput = {
  fullName: string
  phone?: string
  address?: string
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.'
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter.'
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter.'
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number.'
  }
  return null
}

export async function signUp(
  input: SignUpInput
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()

  if (!input.fullName.trim()) {
    return { success: false, error: 'Full name is required.' }
  }

  if (!isValidEmail(input.email)) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  const pwError = validatePassword(input.password)
  if (pwError) {
    return { success: false, error: pwError }
  }

  if (input.password !== input.confirmPassword) {
    return { success: false, error: 'Passwords do not match.' }
  }

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName.trim(),
        phone: input.phone?.trim() || null,
      },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return {
        success: false,
        error: 'An account with this email already exists. Try logging in instead.',
      }
    }
    if (error.message.includes('invalid email')) {
      return { success: false, error: 'Please enter a valid email address.' }
    }
    if (error.message.includes('password')) {
      return { success: false, error: 'Password does not meet requirements.' }
    }
    return { success: false, error: 'Unable to create account. Please try again.' }
  }

  if (!data.user) {
    return { success: false, error: 'Unable to create account. Please try again.' }
  }

  const service = createServiceClient()

  const { error: profileError } = await service
    .from('profiles')
    .upsert({
      id: data.user.id,
      full_name: input.fullName.trim(),
      email: input.email,
      phone: input.phone?.trim() || null,
    })
    .select()
    .single()

  if (profileError) {
    console.error('Profile creation after signup failed:', profileError)
  }

  if (!data.session) {
    return {
      success: true,
      error: 'Please check your email to confirm your account before logging in.',
    }
  }

  revalidatePath('/login')
  revalidatePath('/account')
  return { success: true, error: null }
}

export async function signIn(
  input: SignInInput
): Promise<{ success: boolean; error: string | null; destination?: string }> {
  const supabase = await createClient()

  if (!isValidEmail(input.email)) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  if (!input.password) {
    return { success: false, error: 'Password is required.' }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { success: false, error: 'Incorrect email or password.' }
    }
    if (error.message.includes('Email not confirmed')) {
      return {
        success: false,
        error:
          'Please confirm your email address before logging in. Check your spam folder.',
      }
    }
    return { success: false, error: 'Unable to log in. Please try again.' }
  }

  if (!data.session || !data.user) {
    return { success: false, error: 'Unable to log in. Please try again.' }
  }

  revalidatePath('/')
  revalidatePath('/account')
  return { success: true, error: null }
}

export async function logOut(): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Logout error:', error)
    return { success: false, error: 'Unable to log out. Please try again.' }
  }

  revalidatePath('/')
  return { success: true, error: null }
}

export async function updateProfile(
  input: UpdateProfileInput
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'You must be logged in to update your profile.' }
  }

  if (!input.fullName.trim()) {
    return { success: false, error: 'Full name is required.' }
  }

  if (input.fullName.trim().length > 100) {
    return { success: false, error: 'Full name is too long.' }
  }

  const service = createServiceClient()

  const { error } = await service
    .from('profiles')
    .update({
      id: user.id,
      full_name: input.fullName.trim(),
      phone: input.phone?.trim() || null,
      address: input.address?.trim() || null,
    })
    .eq('id', user.id)

  if (error) {
    console.error('Profile update failed:', error)
    return { success: false, error: 'Unable to update profile. Please try again.' }
  }

  revalidatePath('/account')
  return { success: true, error: null }
}

export async function requestPasswordReset(email: string): Promise<{
  success: boolean
  error: string | null
  message: string | null
}> {
  const supabase = await createClient()

  if (!email || !isValidEmail(email)) {
    return {
      success: false,
      error: 'Please enter a valid email address.',
      message: null,
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  })

  if (error) {
    console.error('Password reset request failed:', error)
    return {
      success: false,
      error: 'Unable to process your request. Please try again.',
      message: null,
    }
  }

  return {
    success: true,
    error: null,
    message:
      'If an account exists for this email, a password reset link has been sent.',
  }
}

export async function updatePassword(input: {
  password: string
}): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()

  const pwError = validatePassword(input.password)
  if (pwError) {
    return { success: false, error: pwError }
  }

  const { data, error } = await supabase.auth.updateUser({
    password: input.password,
  })

  if (error) {
    console.error('Password update failed:', error)
    return {
      success: false,
      error: 'Unable to reset password. The link may have expired. Please request a new reset link.',
    }
  }

  if (!data.user) {
    return {
      success: false,
      error: 'Unable to reset password. Please try again.',
    }
  }

  revalidatePath('/login')
  return { success: true, error: null }
}

export async function signOut() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Sign out error:', error)
  }

  revalidatePath('/')
}
