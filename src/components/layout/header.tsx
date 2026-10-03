'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Menu, X, UserIcon, Search } from 'lucide-react'
import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/cart/cart-context'
import { SearchModal } from '@/components/search/search-modal'
import type { User } from '@supabase/supabase-js'

const navigation = [
  { name: 'Shop', href: '/shop' },
  { name: 'Services', href: '/services' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
]

function AuthButton({ user }: { user: User | null }) {
  if (user) {
    return (
      <Link href="/account">
        <Button variant="ghost" size="md" className="h-10 w-10 p-0">
          <UserIcon size={22} />
          <span className="sr-only">Account</span>
        </Button>
      </Link>
    )
  }

  return (
    <Link href="/login">
      <Button variant="ghost" size="md" className="h-10 w-10 p-0">
        <UserIcon size={22} />
        <span className="sr-only">Account</span>
      </Button>
    </Link>
  )
}

export function Header({ user }: { user: User | null }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { itemCount } = useCart()

  useEffect(() => {
    if (mobileOpen || searchOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen, searchOpen])

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-semibold text-[#0B1F33]">OtabilHub</span>
            <span className="text-xs font-medium text-[#1677FF]">Electrical</span>
          </Link>

          <nav className="hidden md:block">
            <ul className="flex items-center gap-6 text-sm font-medium">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-[#0B1F33] transition-colors hover:text-[#1677FF]"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-0">
            <Button
              variant="ghost"
              size="md"
              className="h-10 w-10 p-0"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={22} />
              <span className="sr-only">Search</span>
            </Button>
            <AuthButton user={user} />
            <Link href="/cart">
              <Button
                variant="ghost"
                size="md"
                className="relative h-8 w-8 p-0 sm:h-10 sm:w-10"
                aria-label={`Cart (${itemCount} items)`}
              >
                <ShoppingBag size={22} />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#1677FF] px-0.5 text-xs font-medium text-white">
                    {itemCount}
                  </span>
                )}
                <span className="sr-only">Cart</span>
              </Button>
            </Link>
            <button
              type="button"
              className="md:hidden p-1 text-[#0B1F33] hover:text-[#1677FF] focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:ring-offset-2 rounded-md"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              <span className="sr-only">Toggle menu</span>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div
            className="md:hidden absolute top-16 left-0 w-full border-b border-gray-200 bg-white"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile menu"
          >
            <nav className="px-2 pb-3 pt-2">
              <ul className="flex flex-col gap-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="flex items-center px-3 py-2 text-sm font-medium text-[#0B1F33] hover:bg-gray-50 hover:text-[#1677FF] rounded-md"
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}
      </Container>

      {searchOpen && <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />}
    </header>
  )
}
