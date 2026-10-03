'use client'

import { useState } from 'react'
import { Container } from '@/components/layout/container'
import { Section } from '@/components/ui/section'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Wrench, ArrowRight } from 'lucide-react'
import { ServiceRequestModal } from '@/components/services/service-request-modal'

export default function ServicesPage() {
  const [showRequestModal, setShowRequestModal] = useState(false)

  return (
    <>
      <Section className="py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-3xl font-light tracking-tight text-[#0B1F33] sm:text-4xl lg:text-5xl">
              Services & Installation
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              Professional installation and setup for applicable electronics,
              electrical, and smart-home products.
            </p>
          </div>
        </Container>
      </Section>

      <section className="border-t border-gray-300/50">
        <Container>
          <div className="py-12 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Installation Service
              </h2>
              <p className="mt-4 text-gray-600">
                OtabilHub provides professional installation and setup services
                for applicable products, including lighting, switches, smart
                switches, sockets, smart and electronic products, and other
                applicable electrical and electronic products.
              </p>

              <div className="mt-8 rounded-md bg-gray-50 border border-gray-200 p-6">
                <p className="text-sm font-medium text-gray-900">
                  Installation is available for an additional charge.
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  The installation charge depends on the product, location, and
                  complexity. Contact us for a quotation.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-gray-300/50">
        <Container>
          <div className="py-12 sm:py-16 lg:py-20">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl mb-8">
              How It Works
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  step: '1',
                  title: 'Purchase or Select',
                  description:
                    'Purchase or select the applicable product you would like installed.',
                },
                {
                  step: '2',
                  title: 'Request Installation',
                  description:
                    'Request installation through our service request system.',
                },
                {
                  step: '3',
                  title: 'Provide Details',
                  description:
                    'Provide your location and preferred timing for the installation.',
                },
                {
                  step: '4',
                  title: 'We Contact You',
                  description:
                    'OtabilHub contacts you to confirm the details and schedule.',
                },
                {
                  step: '5',
                  title: 'Installation Scheduled',
                  description:
                    'Your installation is scheduled at the agreed date and time.',
                },
                {
                  step: '6',
                  title: 'Installation Completed',
                  description:
                    'Our team completes the installation and verifies everything works correctly.',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="border border-gray-200 bg-white p-6"
                >
                  <span className="text-sm font-medium text-[#1677FF]">
                    Step {item.step}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-gray-300/50">
        <Container>
          <div className="py-12 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Ready to Get Started?
              </h2>
              <p className="mt-4 text-gray-600">
                Purchase a product first, then request installation. Our team
                will contact you to schedule the service.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link href="/shop">
                  <Button variant="primary" size="lg">
                    Browse Products
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowRequestModal(true)}
                >
                  <Wrench size={16} className="mr-2" />
                  Request Installation
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-gray-300/50 bg-[#F5F7FA]">
        <Container>
          <div className="py-12 sm:py-16">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl mb-8 text-center">
              Contact for Installation
            </h2>
            <div className="mx-auto max-w-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 py-3">
                <span className="text-sm text-gray-500">Phone</span>
                <div className="flex gap-4">
                  <a
                    href="tel:0248568741"
                    className="text-sm font-medium text-gray-900 hover:text-[#1677FF]"
                  >
                    0248568741
                  </a>
                  <a
                    href="tel:0556238187"
                    className="text-sm font-medium text-gray-900 hover:text-[#1677FF]"
                  >
                    0556238187
                  </a>
                  <a
                    href="tel:0536405125"
                    className="text-sm font-medium text-gray-900 hover:text-[#1677FF]"
                  >
                    0536405125
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <ServiceRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
      />
    </>
  )
}
