import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase/auth'
import { logoutAction } from '@/app/account/actions/logout'
import type { ReactNode } from 'react'

const accountNav = [
  { name: 'Account', href: '/account' },
  { name: 'Orders', href: '/account/orders' },
  { name: 'Profile', href: '/account/profile' },
]

function AccountNav({ currentPath }: { currentPath: string }) {
  return (
    <nav className="space-y-1">
      {accountNav.map((item) => {
        const isActive =
          currentPath === item.href ||
          (item.href !== '/account' && currentPath.startsWith(item.href))
        return (
          <Link
            key={item.name}
            href={item.href}
            className={
              isActive
                ? 'block px-3 py-2 text-sm font-medium text-green-600 bg-green-50 border-l-2 border-green-600'
                : 'block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-green-600 border-l-2 border-transparent'
            }
          >
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}

function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-green-600 border-l-2 border-transparent"
      >
        Log out
      </button>
    </form>
  )
}

export async function AccountLayout({
  children,
  currentPath,
}: {
  children: ReactNode
  currentPath: string
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?next=' + encodeURIComponent(currentPath))
  }

  const profile = await getCurrentProfile()

  if (!profile) {
    redirect('/login?next=' + encodeURIComponent(currentPath))
  }

  return (
    <div className="py-8 sm:py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start gap-12">
          <div className="hidden w-64 flex-shrink-0 lg:block">
            <div className="border-b border-gray-200 pb-4 mb-4">
              <p className="text-sm text-gray-500">Logged in as</p>
              <p className="font-medium text-gray-900">{profile.email}</p>
            </div>
            <AccountNav currentPath={currentPath} />
            <div className="border-t border-gray-200 pt-4 mt-4">
              <LogoutButton />
            </div>
          </div>

          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
