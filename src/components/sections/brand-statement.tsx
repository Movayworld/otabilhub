import { Container } from '@/components/layout/container'

export function BrandStatement() {
  return (
    <section className="border-t border-gray-300/50 py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-display text-2xl font-light text-[#0B1F33] sm:text-3xl">
            Built for what's next.
          </p>
          <p className="mt-4 text-gray-600">
            Smart technology. Reliable products. A better way to live, work,
            and build.
          </p>
        </div>
      </Container>
    </section>
  )
}
