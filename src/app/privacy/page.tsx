import { Container } from '@/components/layout/container'
import { Section } from '@/components/ui/section'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <>
      <Section className="py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h1 className="font-sans text-3xl font-semibold tracking-tight text-[#0B1F33] sm:text-4xl lg:text-5xl">
              Privacy Policy
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
                  1. Information We Collect
                </h2>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  OtabilHub collects the following information to operate our
                  business and serve our customers:
                </p>
                <ul className="mt-3 ml-5 list-disc space-y-2 text-gray-700">
                  <li>Account information: name, email, phone number, address, city</li>
                  <li>Order information: products ordered, quantities, prices, delivery details</li>
                  <li>Service requests: product of interest, location, preferred timing, notes</li>
                  <li>Newsletter subscription: email address</li>
                  <li>Customer communications: messages sent through our contact form</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900">
                  2. How We Use Your Information
                </h2>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  We use the information we collect for the following purposes:
                </p>
                <ul className="mt-3 ml-5 list-disc space-y-2 text-gray-700">
                  <li>To create and manage your account</li>
                  <li>To process your orders and payments</li>
                  <li>To arrange delivery of your products</li>
                  <li>To coordinate installation services where applicable</li>
                  <li>To communicate with you about your orders, services, and inquiries</li>
                  <li>To operate and improve our services</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900">
                  3. Information Sharing
                </h2>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  We do not sell your personal information. We share information
                  only as needed to provide our services, such as sharing delivery
                  details with courier partners or account information with
                  Supabase (our hosting and authentication provider).
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900">
                  4. Data Security
                </h2>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  We implement appropriate security measures to protect your
                  information. However, no online service is completely secure,
                  and we cannot guarantee absolute security.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900">
                  5. Your Rights
                </h2>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  You have the right to access, update, or delete your personal
                  information. You can update your profile information through
                  your account, or contact us for other data requests.
                </p>
              </div>

               <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900">
                  6. Cookies and Tracking
                </h2>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  OtabilHub uses cookies to operate our services, remember your
                  preferences, and understand how visitors interact with our
                  site. You can manage your cookie preferences through the consent
                  banner that appears on your first visit, or by visiting our{' '}
                  <Link
                    href="/cookie-policy"
                    className="text-[#1677FF] hover:underline"
                  >
                    Cookie Policy
                  </Link>
                  .
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900">
                  8. Contact Us
                </h2>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  If you have questions about this Privacy Policy or how we
                  handle your data, please contact us:
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
