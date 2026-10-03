'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/layout/container'
import { Section } from '@/components/ui/section'
import { Button } from '@/components/ui/button'
import { signUp } from '@/lib/actions/auth'

interface FormErrors {
  fullName?: string
  email?: string
  phone?: string
  password?: string
  confirmPassword?: string
}

export default function SignUpPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setServerError(null)

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const errors: FormErrors = {}

    if (fullName.trim().length < 2) {
      errors.fullName = 'Please enter your full name.'
    }

    if (!emailRegex.test(email)) {
      errors.email = 'Please enter a valid email address.'
    }

    if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.'
    } else if (!/[A-Z]/.test(password)) {
      errors.password = 'Password must contain at least one uppercase letter.'
    } else if (!/[a-z]/.test(password)) {
      errors.password = 'Password must contain at least one lowercase letter.'
    } else if (!/[0-9]/.test(password)) {
      errors.password = 'Password must contain at least one number.'
    }

    if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match.'
    }

    setFormErrors(errors)

    if (Object.keys(errors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await signUp({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        phone: phone.trim() || undefined,
      })

      if (result.success) {
        if (result.error) {
          setServerError(result.error)
        } else {
          router.push('/login?signedUp=1')
        }
      } else if (result.error) {
        setServerError(result.error)
      }
    } catch {
      setServerError('Unable to create account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Section className="py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="mx-auto max-w-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Create account
            </h1>
            <p className="mt-3 text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-[#1677FF] hover:text-[#0B3D91]"
              >
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-900"
              >
                Full name
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1677FF] focus:border-[#1677FF]"
                autoComplete="name"
                aria-invalid={!!formErrors.fullName}
                aria-describedby={formErrors.fullName ? 'fullName-error' : undefined}
              />
              {formErrors.fullName && (
                <p
                  id="fullName-error"
                  className="mt-1 text-sm text-red-600"
                >
                  {formErrors.fullName}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-900"
              >
                Email address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1677FF] focus:border-[#1677FF]"
                autoComplete="email"
                aria-invalid={!!formErrors.email}
                aria-describedby={formErrors.email ? 'email-error' : undefined}
              />
              {formErrors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600">
                  {formErrors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-900"
              >
                Phone number <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1677FF] focus:border-[#1677FF]"
                autoComplete="tel"
                aria-invalid={!!formErrors.phone}
                aria-describedby={formErrors.phone ? 'phone-error' : undefined}
              />
              {formErrors.phone && (
                <p id="phone-error" className="mt-1 text-sm text-red-600">
                  {formErrors.phone}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-900"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1677FF] focus:border-[#1677FF]"
                autoComplete="new-password"
                minLength={8}
                aria-invalid={!!formErrors.password}
                aria-describedby={formErrors.password ? 'password-error' : undefined}
              />
              {formErrors.password && (
                <p
                  id="password-error"
                  className="mt-1 text-sm text-red-600"
                >
                  {formErrors.password}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-900"
              >
                Confirm password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1677FF] focus:border-[#1677FF]"
                autoComplete="new-password"
                aria-invalid={!!formErrors.confirmPassword}
                aria-describedby={formErrors.confirmPassword ? 'confirmPassword-error' : undefined}
              />
              {formErrors.confirmPassword && (
                <p
                  id="confirmPassword-error"
                  className="mt-1 text-sm text-red-600"
                >
                  {formErrors.confirmPassword}
                </p>
              )}
            </div>

            {serverError && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-600">{serverError}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            By creating an account, you agree to our{' '}
            <Link
              href="/terms"
              className="text-gray-600 hover:text-[#1677FF] underline"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="text-gray-600 hover:text-[#1677FF] underline"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </Container>
    </Section>
  )
}

