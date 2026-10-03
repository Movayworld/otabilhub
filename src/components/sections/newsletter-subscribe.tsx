'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/layout/container'
import { Section } from '@/components/ui/section'
import { Button } from '@/components/ui/button'
import { subscribeNewsletter } from '@/lib/actions/newsletter'
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react'

export function NewsletterSubscribe() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsSubmitting(true)

    try {
      const result = await subscribeNewsletter({ email })
      if (result.success) {
        setSuccess(true)
        setEmail('')
      } else if (result.error) {
        setError(result.error)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } catch {
      setError('Failed to subscribe. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="border-t border-gray-300/50 bg-[#F5F7FA]">
      <Container>
        <div className="py-12 sm:py-16">
          <div className="mx-auto max-w-xl">
             <h2 className="font-sans text-2xl font-semibold text-[#0B1F33] sm:text-3xl">
              Stay connected with OtabilHub
            </h2>
            <p className="mt-3 text-sm text-gray-600">
              Get updates on new products, installation services, and special offers.
            </p>

            {success ? (
              <div className="mt-6 flex items-center gap-3 rounded-md bg-[#E6F0FF] border border-[#BBDEFB] p-4">
                <CheckCircle2 size={18} className="text-[#1677FF] flex-shrink-0" />
                <p className="text-sm text-[#0B3D91]">
                  Thank you for subscribing! Check your inbox for a confirmation.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="mt-6 flex gap-3">
                <div className="flex-1">
                  <label htmlFor="newsletter-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    type="email"
                    id="newsletter-email"
                    required
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#1677FF] focus:border-[#1677FF] disabled:opacity-50"
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Subscribing...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Mail size={16} className="mr-2" />
                      Subscribe
                    </span>
                  )}
                </Button>
              </form>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-3 rounded-md bg-red-50 border border-red-200 p-4">
                <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  )
}

