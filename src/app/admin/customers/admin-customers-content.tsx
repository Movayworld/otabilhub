'use client'

import { useState, useEffect } from 'react'
import { Container } from '@/components/layout/container'
import { Section } from '@/components/ui/section'
import { Button } from '@/components/ui/button'
import { Users, Mail, Phone, MapPin, Search } from 'lucide-react'

interface Customer {
  id: string
  customer_id: string
  full_name: string | null
  email: string
  phone: string | null
  city: string | null
  created_at: string
  order_count: number
}

export default function AdminCustomersContent() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const loadCustomers = async (q = '') => {
    setLoading(true)
    setError(null)
    try {
      const url = q ? `/api/admin/customers?q=${encodeURIComponent(q)}` : '/api/admin/customers'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.customers || [])
      } else {
        setError('Failed to load customers')
      }
    } catch {
      setError('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCustomers() }, [])

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    loadCustomers(search)
  }

  return (
    <Container>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Customers
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          View registered customer accounts and their information. Search by name, email, phone, city, or customer ID (e.g. CUST-123456).
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-6 flex gap-3">
        <input
          type="text"
          placeholder="Search customers or enter CUST-123456..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-600"
        />
        <Button type="submit" variant="outline" size="sm">
          <Search size={16} className="mr-2" />
          Search
        </Button>
      </form>

      <div className="border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Users size={24} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No customers found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[120px]">Customer ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[120px]">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[180px]">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[120px]">Phone</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[100px]">City</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 min-w-[70px]">Orders</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[120px]">Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-gray-200">
                    <td className="py-3 px-4 font-mono text-sm text-gray-900">{customer.customer_id}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {customer.full_name || '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {customer.email}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {customer.phone || '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {customer.city || '—'}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-900">
                      {customer.order_count}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(customer.created_at).toLocaleDateString('en-GH', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Container>
  )
}
