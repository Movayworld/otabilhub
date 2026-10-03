import { Container } from '@/components/layout/container'
import { Section } from '@/components/ui/section'
import { Zap, Shield, Headphones, Truck } from 'lucide-react'

export default function AboutPage() {
  return (
    <>
      <Section className="py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-3xl font-light tracking-tight text-[#0B1F33] sm:text-4xl lg:text-5xl">
              About OtabilHub
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              A modern business providing electronics, electrical products,
              technology products, and practical solutions.
            </p>
          </div>
        </Container>
      </Section>

      <section className="border-t border-gray-300/50">
        <Container>
          <div className="py-12 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-3xl">
              <p className="text-lg text-gray-700 leading-relaxed">
                OtabilHub is a modern electronics and electrical products
                business. We provide a curated selection of technology products
                designed for everyday life — from switches, sockets, and
                lighting to smart home devices, phones, chargers, audio
                equipment, cables, accessories, and Arduino electronic
                components.
              </p>
              <p className="mt-4 text-lg text-gray-700 leading-relaxed">
                Our mission is to make quality electronics and electrical
                products accessible, with professional installation services
                available where needed. We are committed to reliable service,
                fair pricing, and helping customers find the right products for
                their homes and businesses.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-gray-300/50">
        <Container>
          <div className="py-12 sm:py-16 lg:py-20">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl mb-10 text-center">
              What We Stand For
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Zap,
                  title: 'Accessible Technology',
                  description:
                    'Quality electronics and electrical products for everyone.',
                },
                {
                  icon: Shield,
                  title: 'Reliable Service',
                  description:
                    'Professional installation and dependable customer support.',
                },
                {
                  icon: Headphones,
                  title: 'Practical Solutions',
                  description:
                    'Products chosen for real-world use and everyday value.',
                },
                {
                  icon: Truck,
                  title: 'Fast Delivery',
                  description:
                    'We target delivery within two days of purchase.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="border border-gray-200 bg-white p-6 text-center"
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                    <item.icon size={22} className="text-[#1677FF]" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-gray-300/50 bg-[#F5F7FA]">
        <Container>
          <div className="py-12 sm:py-16">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Get in Touch
              </h2>
              <p className="mt-4 text-gray-600">
                Have questions? We are here to help.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3">
                <a
                  href="tel:0248568741"
                  className="text-lg font-medium text-[#1677FF] hover:text-[#0B3D91]"
                >
                  0248568741
                </a>
                <a
                  href="tel:0556238187"
                  className="text-lg font-medium text-[#1677FF] hover:text-[#0B3D91]"
                >
                  0556238187
                </a>
                <a
                  href="tel:0536405125"
                  className="text-lg font-medium text-[#1677FF] hover:text-[#0B3D91]"
                >
                  0536405125
                </a>
              </div>
              <div className="mt-6">
                <a href="/contact">
                  <span className="text-sm font-medium text-gray-600 hover:text-[#1677FF] underline">
                    Visit our Contact page
                  </span>
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
