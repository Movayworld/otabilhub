'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/layout/container'
import { Section } from '@/components/ui/section'
import { Button } from '@/components/ui/button'
import { requestPasswordReset } from '@/lib/actions/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setServerError(null)
    setSuccessMessage(null)

    if (!email.trim()) {
      setEmailError('Email address is required.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address.')
      return
    }

    setEmailError(null)
    setIsSubmitting(true)

    try {
      const result = await requestPasswordReset(email.trim())

      if (result.success && result.message) {
        setSuccessMessage(result.message)
        setEmail('')
      } else if (result.error) {
        setServerError(result.error)
      }
    } catch {
      setServerError('Unable to process your request. Please try again.')
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
              Forgot your password?
            </h1>
            <p className="mt-3 text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </div>

          {successMessage ? (
            <div className="mt-8 text-center">
              <div className="rounded-md bg-[#E6F0FF] p-4">
                <p className="text-sm text-[#0B3D91]">{successMessage}</p>
              </div>
              <p className="mt-4 text-center text-sm text-gray-600">
                <Link
                  href="/login"
                  className="font-medium text-[#1677FF] hover:text-[#0B3D91]"
                >
                  Back to sign in
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'email-error' : undefined}
                />
                {emailError && (
                  <p id="email-error" className="mt-1 text-sm text-red-600">
                    {emailError}
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
                    Sending reset link...
                  </span>
                ) : (
                  'Send reset link'
                )}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-600">
            <Link
              href="/login"
              className="font-medium text-gray-600 hover:text-[#1677FF]"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </Container>
    </Section>
  )
}

