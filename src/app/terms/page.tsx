import { Container } from '@/components/layout/container'
import { Section } from '@/components/ui/section'

export default function TermsPage() {
  return (
    <>
      <Section className="py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h1 className="font-sans text-3xl font-semibold tracking-tight text-[#0B1F33] sm:text-4xl lg:text-5xl">
              Terms of Service
            </h1>
            <p className="mt-6 text-gray-600">
              Last updated: {new Date().toLocaleDateString('en-GH', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </Container>
      </Section>

      <section className="border-t border-gray-300/50">
        <Container>
          <div className="py-12 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-3xl space-y-8">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900">
                  1. Products and Availability
                </h2>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  All products on OtabilHub are offered subject to availability.
                  We strive to keep product information accurate, but stock
                  levels and pricing are subject to change without notice. If a
                  product you have ordered becomes unavailable, we will notify
                  you and offer a suitable alternative or refund.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900">
                  2. Pricing
                </h2>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  All prices are listed in Ghana Cedis (GHS) and are subject to
                  change. We make every effort to display accurate prices, but
                  errors may occur. We reserve the right to correct pricing
                  errors before fulfilling orders.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900">
                  3. Orders and Payment
                </h2>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  When you place an order, you authorize us to process your
                  payment. Orders are confirmed when we receive your payment
                  information. We reserve the right to cancel or refuse orders
                  where appropriate.
                </p>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  Payment state is tracked separately from order fulfillment
                  status. Orders are created with payment state "pending" until
                  payment is confirmed.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900">
                  4. Delivery
                </h2>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  OtabilHub currently targets delivery within two days after
                  purchase. Delivery times are an estimate and not an absolute
                  guarantee. Circumstances that may affect delivery include:
                </p>
                <ul className="mt-3 ml-5 list-disc space-y-2 text-gray-700">
                  <li>Incorrect or incomplete customer information</li>
                  <li>Circumstances outside OtabilHub&apos;s control</li>
                  <li>Unusual delivery circumstances</li>
                </ul>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  We do not currently provide delivery tracking. You will be
                  contacted when your order is ready for delivery or dispatch.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900">
                  5. Installation Services
                </h2>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  Installation services are available for applicable products at
                  an additional charge. Installation pricing depends on the
                  product, location, and complexity. By requesting installation,
                  you agree to the quoted price and schedule.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900">
                  6. Customer Information
                </h2>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  By using OtabilHub, you agree to provide accurate and complete
                  information, including your full name, phone number, shipping
                  address, and email address. You are responsible for keeping
                  this information up to date.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900">
                  7. Cancellations and Refunds
                </h2>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  Orders may be cancelled before they are processed. Once an
                  order has been processed, cancellation may not be possible.
                  Refunds are handled on a case-by-case basis. Please contact us
                  for refund requests.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900">
                  8. Limitation of Liability
                </h2>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  OtabilHub is not liable for damages resulting from circumstances
                  beyond our control, including but not limited to delivery
                  delays, product unavailability, or issues arising from
                  incorrect customer information.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900">
                  9. Contact Information
                </h2>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  For questions about these terms, or for any other inquiries:
                </p>
                <ul className="mt-3 ml-5 list-disc space-y-2 text-gray-700">
                  <li>Phone:{' '}
                    <a href="tel:0248568741" className="text-[#1677FF] hover:underline">0248568741</a>,{' '}
                    <a href="tel:0556238187" className="text-[#1677FF] hover:underline">0556238187</a>,{' '}
                    <a href="tel:0536405125" className="text-[#1677FF] hover:underline">0536405125</a>
                  </li>
                  <li>Email: info@otabilhub.com</li>
                </ul>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
