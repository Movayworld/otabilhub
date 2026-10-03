import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'

export function ServicesSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-light tracking-tight text-[#0B1F33] sm:text-4xl">
            Professional Installation
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Need it installed? We provide professional installation and setup
            for applicable technology, electrical, and smart-home products.
          </p>
          <div className="mt-8">
            <Link href="/services">
              <Button variant="primary" size="lg">
                Explore Services
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
