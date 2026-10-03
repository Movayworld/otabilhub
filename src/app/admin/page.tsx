import Link from 'next/link'
import { Suspense } from 'react'
import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'
import { AdminLayout } from '@/app/admin/components/admin-layout'
import { getDashboardStats } from '@/lib/queries/admin'
import type { Database } from '@/types/supabase'

function StatCard({
  label,
  value,
  href,
  hrefLabel,
}: {
  label: string
  value: number
  href: string
  hrefLabel: string
}) {
  return (
    <div className="border border-gray-200 bg-gray-50 p-6">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      <Link href={href} className="mt-4 block text-sm font-medium text-green-600 hover:text-green-700">
        {hrefLabel} &rarr;
      </Link>
    </div>
  )
}

async function DashboardStats() {
  const stats = await getDashboardStats()

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        label="Total Products"
        value={stats.totalProducts}
        href="/admin/products"
        hrefLabel="Manage products"
      />
      <StatCard
        label="Published Products"
        value={stats.publishedProducts}
        href="/admin/products"
        hrefLabel="View published"
      />
      <StatCard
        label="Low Stock"
        value={stats.lowStockProducts}
        href="/admin/products"
        hrefLabel="Review low stock"
      />
      <StatCard
        label="Total Orders"
        value={stats.totalOrders}
        href="/admin/orders"
        hrefLabel="View orders"
      />
      <StatCard
        label="Pending Orders"
        value={stats.pendingOrders}
        href="/admin/orders"
        hrefLabel="Review pending"
      />
      <StatCard
        label="Service Requests"
        value={stats.totalServiceRequests}
        href="/admin/service-requests"
        hrefLabel="View requests"
      />
      <StatCard
        label="Registered Customers"
        value={stats.totalCustomers}
        href="/admin/customers"
        hrefLabel="View customers"
      />
      <StatCard
        label="Newsletter Subscribers"
        value={stats.totalSubscribers}
        href="/admin/newsletter"
        hrefLabel="View subscribers"
      />
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="border border-gray-200 bg-gray-50 p-6 animate-pulse">
      <div className="h-5 w-32 bg-gray-200 rounded"></div>
      <div className="mt-2 h-8 w-16 bg-gray-200 rounded"></div>
      <div className="mt-4 h-4 w-24 bg-gray-200 rounded"></div>
    </div>
  )
}

export default async function AdminDashboardPage() {
  return (
    <AdminLayout currentPath="/admin">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">
          Dashboard
        </h1>

        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Overview</h2>
          <Suspense fallback={<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></div>}>
            <DashboardStats />
          </Suspense>
        </div>
      </div>
    </AdminLayout>
  )
}
