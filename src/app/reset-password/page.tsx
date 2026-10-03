'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Container } from '@/components/layout/container'
import { Section } from '@/components/ui/section'
import { Button } from '@/components/ui/button'
import { updatePassword } from '@/lib/actions/auth'

interface FormErrors {
  password?: string
  confirmPassword?: string
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [serverSuccess, setServerSuccess] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setServerError(null)
    setServerSuccess(null)

    const errors: FormErrors = {}

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
      const result = await updatePassword({ password })
      if (result.success) {
        setServerSuccess('Your password has been reset. You can now log in.')
        router.push('/login')
      } else if (result.error) {
        setServerError(result.error)
      }
    } catch {
      setServerError('Unable to reset password. Please try again.')
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
              Reset your password
            </h1>
            <p className="mt-3 text-sm text-gray-600">
              Enter a new password for your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-900"
              >
                New password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
                autoComplete="new-password"
                minLength={8}
                aria-invalid={!!formErrors.password}
                aria-describedby={formErrors.password ? 'password-error' : undefined}
              />
              {formErrors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-600">
                  {formErrors.password}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-900"
              >
                Confirm new password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
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

            {serverSuccess && (
              <div className="rounded-md bg-green-50 p-3">
                <p className="text-sm text-green-800">{serverSuccess}</p>
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
                  Resetting password...
                </span>
              ) : (
                'Reset password'
              )}
            </Button>
          </form>
        </div>
      </Container>
    </Section>
  )
}
