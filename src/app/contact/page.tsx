'use client'

import { useState } from 'react'
import { Container } from '@/components/layout/container'
import { Section } from '@/components/ui/section'
import { Button } from '@/components/ui/button'
import { createContactMessage } from '@/lib/actions/contact'
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react'

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const result = await createContactMessage(formData)
      if (result.success) {
        setSubmitted(true)
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
      } else if (result.error) {
        setSubmitError(result.error)
      } else {
        setSubmitError('An unexpected error occurred. Please try again.')
      }
    } catch {
      setSubmitError('Failed to send your message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Section className="py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-sans text-3xl font-semibold tracking-tight text-[#0B1F33] sm:text-4xl lg:text-5xl">
              Contact Us
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              Have questions about our products, services, or orders? We are
              here to help.
            </p>
          </div>
        </Container>
      </Section>

      <section className="border-t border-gray-300/50">
        <Container>
          <div className="py-12 sm:py-16">
            <div className="mx-auto max-w-2xl space-y-4">
              <div className="flex items-center gap-4 border-b border-gray-200 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
                  <Phone size={18} className="text-[#1677FF]" />
                </div>
                <div>
                <p className="text-sm text-gray-500">Phone</p>
                   <div className="flex gap-3">
                     <a
                       href="tel:0248568741"
                       className="font-medium text-gray-900 hover:text-[#1677FF]"
                     >
                       0248568741
                     </a>
                     <a
                       href="tel:0556238187"
                       className="font-medium text-gray-900 hover:text-[#1677FF]"
                     >
                       0556238187
                     </a>
                     <a
                       href="tel:0536405125"
                       className="font-medium text-gray-900 hover:text-[#1677FF]"
                     >
                      0536405125
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 border-b border-gray-200 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
                  <Mail size={18} className="text-[#1677FF]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">
                    info@otabilhub.com
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 border-b border-gray-200 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
                  <MapPin size={18} className="text-[#1677FF]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium text-gray-900">
                    Contact us by phone or email for our location.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-gray-300/50">
        <Container>
          <div className="py-12 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-xl">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl mb-8">
                Send us a Message
              </h2>

              {submitted ? (
                <div className="rounded-md bg-[#E6F0FF] border border-[#BBDEFB] p-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-[#1677FF]" />
                    <h3 className="text-lg font-semibold text-green-900">
                      Message sent
                    </h3>
                  </div>
                  <p className="mt-2 text-sm text-[#0B3D91]">
                    Thank you for contacting us. We will get back to you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-900"
                    >
                      Full name
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1677FF] focus:border-[#1677FF]"
                    />
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
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1677FF] focus:border-[#1677FF]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-900"
                    >
                      Phone number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1677FF] focus:border-[#1677FF]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-gray-900"
                    >
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      required
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1677FF] focus:border-[#1677FF]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-900"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      required
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1677FF] focus:border-[#1677FF] resize-y"
                    />
                  </div>

                  {submitError && (
                    <div className="rounded-md bg-red-50 p-3">
                      <p className="text-sm text-red-600">{submitError}</p>
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
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <Send size={16} className="mr-2" />
                        Send Message
                      </span>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}

