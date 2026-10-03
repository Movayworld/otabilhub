import { Container } from '@/components/layout/container'
import { Section } from '@/components/ui/section'
import Link from 'next/link'

export default function CookiePolicyPage() {
  return (
    <>
      <Section className="py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h1 className="font-sans text-3xl font-semibold tracking-tight text-[#0B1F33] sm:text-4xl lg:text-5xl">
              Cookie Policy
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
                  1. What Are Cookies
                </h2>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  Cookies are small text files stored on your device when you visit a website. We use them to
                  remember your preferences, understand how our site is used, and deliver relevant content.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900">
                  2. Cookies We Use
                </h2>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  We use the following categories of cookies:
                </p>
                <ul className="mt-3 ml-5 list-disc space-y-2 text-gray-700">
                  <li>
                    <span className="font-medium">Essential Cookies</span> — Required for core functionality
                    (e.g., shopping cart, checkout, authentication). Without these, the site will not function.
                  </li>
                  <li>
                    <span className="font-medium">Analytics Cookies</span> — Help us understand how visitors
                    interact with our site by collecting anonymous, aggregated data.
                  </li>
                  <li>
                    <span className="font-medium">Marketing Cookies</span> — Used to deliver relevant
                    advertisements and measure the effectiveness of our marketing campaigns.
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900">
                  3. How We Use Cookies
                </h2>
                <ul className="mt-3 ml-5 list-disc space-y-2 text-gray-700">
                  <li>To maintain your shopping cart and checkout session.</li>
                  <li>To authenticate your account and keep you logged in.</li>
                  <li>To remember your cookie consent preferences.</li>
                  <li>To analyze site performance and improve user experience.</li>
                  <li>To personalize content and marketing communications.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900">
                  4. Your Consent
                </h2>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  When you first visit our site, a consent banner appears. You can accept all cookies, reject
                  non-essential cookies, or customize your preferences. Your choice is stored in a cookie for
                  future visits. You may change your preferences at any time.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900">
                  5. Managing Cookies
                </h2>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  Most web browsers allow you to control cookies through their settings. You can set your
                  browser to refuse all or some cookies, or to alert you when cookies are being set. However,
                  disabling essential cookies may cause parts of our site to not function properly.
                </p>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  To manage cookies via your browser:
                </p>
                <ul className="mt-3 ml-5 list-disc space-y-2 text-gray-700">
                  <li>
                    <a
                      href="https://support.google.com/chrome/answer/95642"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1677FF] hover:underline"
                  >
                      Google Chrome
                  </a>
                  </li>
                  <li>
                    <a
                      href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1677FF] hover:underline"
                    >
                      Mozilla Firefox
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1677FF] hover:underline"
                    >
                      Safari
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://support.microsoft.com/en-us/microsoft-edge/delete-or-disallow-cookies-in-microsoft-edge-8a84a56a-3c9a-2deb-9c6d-83bca9664d56"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1677FF] hover:underline"
                    >
                      Microsoft Edge
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900">
                  6. Third-Party Cookies
                </h2>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  Some cookies are placed by third-party services we use, including Supabase for hosting and
                  authentication, and Resend for email services. These providers may set cookies in accordance
                  with their own privacy policies.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900">
                  7. Contact Us
                </h2>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  If you have questions about our use of cookies or this policy, please contact us:
                </p>
                <ul className="mt-3 ml-5 list-disc space-y-2 text-gray-700">
                  <li>Email: info@otabilhub.com</li>
                  <li>
                    Phone:{' '}
                    <a href="tel:0248568741" className="text-[#1677FF] hover:underline">0248568741</a>,{' '}
                    <a href="tel:0556238187" className="text-[#1677FF] hover:underline">0556238187</a>,{' '}
                    <a href="tel:0536405125" className="text-[#1677FF] hover:underline">0536405125</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
