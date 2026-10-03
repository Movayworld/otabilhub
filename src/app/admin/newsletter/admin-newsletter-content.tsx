'use client'

import { useState } from 'react'
import { Container } from '@/components/layout/container'
import { Section } from '@/components/ui/section'
import { Button } from '@/components/ui/button'
import { Mail, CheckCircle2, AlertCircle, Loader2, Users, ChevronDown, ChevronUp } from 'lucide-react'

interface Subscriber {
  id: string
  email: string
  subscribed_at: string
  is_active: boolean
}

export default function AdminNewsletterContent() {
  const [testEmail, setTestEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [showSubscribers, setShowSubscribers] = useState(false)

  const handleTestSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(true)
        setTestEmail('')
        loadSubscribers()
      } else {
        setError(data.error || 'Failed')
      }
    } catch {
      setError('Failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const loadSubscribers = async () => {
    try {
      const res = await fetch('/api/newsletter/subscribers')
      if (res.ok) {
        const data = await res.json()
        setSubscribers(data.subscribers || [])
      }
    } catch {
      // ignore
    }
  }

  return (
    <Container>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Newsletter Subscribers
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage newsletter subscriptions and test subscription flow.
        </p>
      </div>

      <div className="mb-8 border border-gray-200 bg-gray-50 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Test Subscription</h2>
        <form onSubmit={handleTestSubscribe} noValidate className="flex gap-3 max-w-md">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@email.com"
            required
            className="flex-1 text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
          />
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Mail size={16} className="mr-2" />
            )}
            Subscribe
          </Button>
        </form>
        {success && (
          <div className="mt-3 flex items-center gap-2 rounded-md bg-green-50 p-3">
            <CheckCircle2 size={16} className="text-green-600" />
            <p className="text-sm text-green-800">Subscription successful!</p>
          </div>
        )}
        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-md bg-red-50 p-3">
            <AlertCircle size={16} className="text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      <div className="mb-8">
        <button
          type="button"
          onClick={() => { setShowSubscribers(!showSubscribers); if (!showSubscribers) loadSubscribers() }}
          className="flex items-center gap-2 text-sm font-medium text-[#1677FF] hover:text-[#0B3D91]"
        >
          {showSubscribers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <Users size={16} />
          {subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''}
        </button>

        {showSubscribers && (
          <div className="mt-4 border border-gray-200 bg-white overflow-hidden">
            {subscribers.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">No subscribers yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub) => (
                    <tr key={sub.id} className="border-b border-gray-200">
                      <td className="py-3 px-4 text-gray-900">{sub.email}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(sub.subscribed_at).toLocaleDateString('en-GH', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs px-2 py-1 rounded ${sub.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {sub.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </Container>
  )
}
