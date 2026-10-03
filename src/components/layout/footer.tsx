'use client'

import Link from 'next/link'
import { Container } from '@/components/layout/container'

const productCategories = [
  { name: 'Circuit Breakers', href: '/shop?category=circuit-breakers' },
  { name: 'Electrical Panels', href: '/shop?category=electrical-panels' },
  { name: 'Wiring & Cables', href: '/shop?category=wiring-cables' },
  { name: 'Switches & Outlets', href: '/shop?category=switches-outlets' },
  { name: 'Lighting', href: '/shop?category=lighting' },
  { name: 'Tools', href: '/shop?category=tools' },
  { name: 'Fans & Ventilation', href: '/shop?category=fans' },
]

const customerService = [
  { name: 'Contact Us', href: '/contact' },
  { name: 'Shipping Policy', href: '/shipping' },
  { name: 'Returns & Warranty', href: '/returns' },
  { name: 'FAQ', href: '/faq' },
  { name: 'Installation Services', href: '/services' },
  { name: 'Track Order', href: '/account/orders' },
]

const legalLinks = [
  { name: 'Privacy Policy', href: '/privacy' },
  { name: 'Terms of Service', href: '/terms' },
  { name: 'Cookie Policy', href: '/cookie-policy' },
]

export function Footer() {
  const year = new Date().getFullYear()

  const dispatchAdminClick = () => {
    const event = new CustomEvent('adminClick')
    window.dispatchEvent(event)
  }

  return (
    <footer className="border-t border-gray-300/50 bg-[#F5F7FA] pt-14">
      <Container>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold text-[#0B1F33]">Product Categories</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-gray-600">
              {productCategories.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-600 transition-colors hover:text-[#1677FF]"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#0B1F33]">Customer Service</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-gray-600">
              {customerService.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-600 transition-colors hover:text-[#1677FF]"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#0B1F33]">Contact</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-gray-600">
              <li>info@otabilhub.com</li>
              <li>+233 30 123 4567</li>
              <li>Accra, Ghana</li>
              <li>Mon-Fri: 8am - 5pm</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#0B1F33]">Legal</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-gray-600">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-600 transition-colors hover:text-[#1677FF]"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-300/30 pt-6">
          <div
            id="admin-trigger"
            className="cursor-pointer select-none text-center"
            role="button"
            tabIndex={0}
            onClick={dispatchAdminClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                dispatchAdminClick()
              }
            }}
          >
            <p className="text-xs text-gray-500">
              &copy; {year} OtabilHub.
            </p>
          </div>
          <p className="mt-1 text-center text-xs text-gray-500">
            Created by{' '}
            <a
              href="https://moval.world"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 underline hover:text-[#1677FF]"
            >
              moval.world
            </a>
          </p>
        </div>
      </Container>
    </footer>
  )
}
