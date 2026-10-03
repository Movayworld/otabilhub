'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  Wrench,
  Users,
  Mail,
  Palette,
  MapPin,
  BarChart3,
  Image,
  X,
  Menu,
  LogOut,
} from 'lucide-react'
import { adminSignOut } from '@/lib/actions/admin-auth'

const adminNav = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Categories', href: '/admin/categories', icon: ShoppingCart },
  { name: 'Orders', href: '/admin/orders', icon: ClipboardList },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Contact Messages', href: '/admin/contact', icon: Mail },
  { name: 'Service Requests', href: '/admin/service-requests', icon: Wrench },
  { name: 'Newsletter', href: '/admin/newsletter', icon: Mail },
  { name: 'Branding', href: '/admin/branding', icon: Palette },
  { name: 'Delivery', href: '/admin/delivery', icon: MapPin },
  { name: 'Inventory', href: '/admin/inventory', icon: BarChart3 },
  { name: 'Hero', href: '/admin/hero', icon: Image },
]

export function AdminNav({ currentPath }: { currentPath: string }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const path = currentPath || pathname

  return (
    <>
      <button
        type="button"
        className="lg:hidden p-2 -ml-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 rounded-md"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        aria-expanded={mobileOpen}
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-200 ease-in-out lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <Link href="/admin" className="text-xl font-semibold text-gray-900">
              Admin
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="p-1 text-gray-500 hover:text-gray-900"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-1" role="navigation" aria-label="Admin navigation">
            {adminNav.map((item) => {
              const isActive = path === item.href || (item.href !== '/admin' && path.startsWith(item.href + '/'))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
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
          <div className="p-3 border-t border-gray-200">
            <form action={adminSignOut}>
              <button
                type="submit"
                className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              >
                <LogOut size={16} />
                <span>Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-shrink-0 lg:block">
        <nav className="space-y-1" role="navigation" aria-label="Admin navigation">
          {adminNav.map((item) => {
            const isActive =
              path === item.href ||
              (item.href !== '/admin' && path.startsWith(item.href + '/'))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
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
      </aside>
    </>
  )
}
