'use client'

import Link from 'next/link'
import { Container } from '@/components/layout/container'

const footerLinks = [
  { name: 'Shop', href: '/shop' },
  { name: 'Services', href: '/services' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
  { name: 'Privacy', href: '/privacy' },
  { name: 'Cookie Policy', href: '/cookie-policy' },
  { name: 'Terms', href: '/terms' },
]

export function Footer() {
  const year = new Date().getFullYear()

  const dispatchAdminClick = () => {
    const event = new CustomEvent('adminClick')
    window.dispatchEvent(event)
  }

  return (
    <footer className="border-t border-gray-300/50 bg-[#F5F7FA] py-8">
      <Container>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div
            id="admin-trigger"
            className="cursor-pointer select-none"
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
          <ul className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
            {footerLinks.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className="text-gray-500 transition-colors hover:text-[#1677FF]"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      <div className="mt-4 border-t border-gray-300/30 pt-4">
        <Container>
          <p className="text-center text-xs text-gray-500">
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
        </Container>
       </div>
    </footer>
  )
}
