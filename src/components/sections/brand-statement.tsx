import { Container } from '@/components/layout/container'

export function BrandStatement() {
  return (
    <section className="border-t border-gray-300/50 py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-sans text-2xl font-semibold text-[#0B1F33] sm:text-3xl">
            Reliable electrical technology for modern spaces.
          </p>
          <p className="mt-4 text-gray-600">
            Professional supply. Expert advice. Smart solutions.
          </p>
        </div>
      </Container>
    </section>
  )
}
