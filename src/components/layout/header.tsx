'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Menu, X, UserIcon, Search } from 'lucide-react'
import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/cart/cart-context'
import { cn } from '@/lib/utils'
import { SearchModal } from '@/components/search/search-modal'
import type { User } from '@supabase/supabase-js'

const navigation = [
  { name: 'Shop', href: '/shop' },
  { name: 'Services', href: '/services' },
  { name: 'About', href: '/about' },
]

function AuthButton({ user }: { user: User | null }) {
  if (user) {
    return (
      <Link href="/account">
        <Button variant="ghost" size="md" className="h-10 w-10 p-0">
          <UserIcon size={20} />
          <span className="sr-only">Account</span>
        </Button>
      </Link>
    )
  }

  return (
    <Link href="/login">
      <Button variant="ghost" size="md" className="h-10 w-10 p-0">
        <UserIcon size={20} />
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
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <header className="fixed top-4 left-0 z-50 w-full">
      <Container>
        <div className="flex h-12 items-center justify-between rounded-full border border-gray-300/50 bg-[#F5F7FA]/80 px-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-1.5 text-[#0B1F33] hover:text-[#1677FF] focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:ring-offset-2 rounded-md"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              <span className="sr-only">Toggle menu</span>
              {mobileOpen ? (
                <X size={18} />
              ) : (
                <Menu size={18} />
              )}
            </button>
          </div>

          <nav className="hidden md:block">
            <ul className="flex items-center gap-5 text-sm font-light">
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

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="md"
              className="h-10 w-10 p-0"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={20} />
              <span className="sr-only">Search</span>
            </Button>
            <AuthButton user={user} />
            <Link href="/cart">
              <Button
                variant="ghost"
                size="md"
                className="relative h-10 w-10 p-0"
                aria-label={`Cart (${itemCount} items)`}
              >
                <ShoppingBag size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#1677FF] px-1 text-xs font-medium text-white">
                    {itemCount}
                  </span>
                )}
                <span className="sr-only">Cart</span>
              </Button>
            </Link>
          </div>
        </div>

        {mobileOpen && (
          <div
            className="md:hidden absolute top-full left-0 mt-2 w-full rounded-lg border border-gray-300/50 bg-[#F5F7FA]/95 p-3 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile menu"
          >
            <nav className="px-2 pb-2 pt-1">
              <ul className="flex flex-col gap-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2 text-sm font-light text-[#0B1F33] hover:bg-gray-100 hover:text-[#1677FF] rounded-md"
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
                <li className="border-t border-gray-300/30 pt-2 mt-2">
                  <Link
                    href="/login"
                    className="flex items-center gap-3 px-3 py-2 text-sm font-light text-[#0B1F33] hover:bg-gray-100 hover:text-[#1677FF] rounded-md"
                    onClick={() => setMobileOpen(false)}
                  >
                    <UserIcon size={16} />
                    Account
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </Container>

      {searchOpen && <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />}
    </header>
  )
}
