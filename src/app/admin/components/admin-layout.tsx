import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/supabase/admin'
import { adminSignOut } from '@/lib/actions/admin-auth'
import { AdminNav } from './admin-nav'
import type { ReactNode } from 'react'

export async function AdminLayout({
  children,
  currentPath,
}: {
  children: ReactNode
  currentPath: string
}) {
  const user = await getAdminUser()

  if (!user) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <AdminNav currentPath={currentPath} />
              <Link href="/admin" className="text-xl font-semibold text-gray-900">
                Admin
              </Link>
            </div>
            <form action={adminSignOut}>
              <button
                type="submit"
                className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <main className="flex-1 overflow-x-auto">{children}</main>
        </div>
      </div>
    </div>
  )
}
