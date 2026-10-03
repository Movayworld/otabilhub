'use client'

import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  Wrench,
  Image,
  Menu,
  X,
} from 'lucide-react'

const adminNav = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Categories', href: '/admin/categories', icon: ShoppingCart },
  { name: 'Orders', href: '/admin/orders', icon: ClipboardList },
  { name: 'Service Requests', href: '/admin/service-requests', icon: Wrench },
  { name: 'Hero', href: '/admin/hero', icon: Image },
]

export function AdminNav({ currentPath }: { currentPath: string }) {
  return (
    <nav className="space-y-1" role="navigation" aria-label="Admin navigation">
      {adminNav.map((item) => {
        const isActive =
          currentPath === item.href ||
          (item.href !== '/admin' && currentPath.startsWith(item.href))
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <item.icon size={18} />
            <span>{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function AdminMobileNav({ currentPath }: { currentPath: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        aria-expanded={open}
        aria-controls="admin-mobile-menu"
      >
        <Menu size={18} />
        <span>Menu</span>
      </button>

      {open && (
        <div
          id="admin-mobile-menu"
          className="mt-2 space-y-1 border-t border-gray-200 pt-2"
        >
          {adminNav.map((item) => {
            const isActive =
              currentPath === item.href ||
              (item.href !== '/admin' && currentPath.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
                onClick={() => setOpen(false)}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
