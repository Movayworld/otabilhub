'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateServiceRequest } from '@/lib/actions/admin-mutations'
import type { Database } from '@/types/supabase'

type ServiceRequest = Database['public']['Tables']['service_requests']['Row']

export default function ServiceRequestDetail({ request }: { request: ServiceRequest }) {
  const router = useRouter()
  const [status, setStatus] = useState(request.status)
  const [notes, setNotes] = useState(request.notes || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true)
    setSaveSuccess(null)
    const result = await updateServiceRequest(request.id, { status: newStatus })
    if (result.success) {
      setStatus(newStatus)
      setSaveSuccess('Status updated.')
      router.refresh()
    }
    setIsUpdating(false)
  }

  const handleSaveNotes = async () => {
    setIsUpdating(true)
    setSaveSuccess(null)
    const result = await updateServiceRequest(request.id, { notes: notes || null })
    if (result.success) {
      setSaveSuccess('Notes saved.')
      router.refresh()
    }
    setIsUpdating(false)
  }

  return (
    <div>
      <div className="mb-8 flex items-baseline justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Service Request #{request.id.slice(0, 8).toUpperCase()}
        </h1>
        <span className="text-sm text-gray-500">
          {new Date(request.created_at).toLocaleDateString('en-GH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </div>

      {saveSuccess && (
        <div className="mb-4 rounded-md bg-green-50 p-3">
          <p className="text-sm text-green-600">{saveSuccess}</p>
        </div>
      )}

      <div className="border border-gray-200 bg-gray-50 p-6 mb-8">
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isUpdating}
              className="mt-1 text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
            >
              <option value="pending">Pending</option>
              <option value="contacted">Contacted</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <p className="text-sm text-gray-500">Service Type</p>
            <p className="font-medium text-gray-900">{request.service_type}</p>
          </div>
          {request.price && (
            <div>
              <p className="text-sm text-gray-500">Price</p>
              <p className="font-medium text-gray-900">
                {new Intl.NumberFormat('en-GH', {
                  style: 'currency',
                  currency: 'GHS',
                  minimumFractionDigits: 2,
                }).format(Number(request.price))}
              </p>
            </div>
          )}
        </div>
      </div>

      {request.address && (
        <div className="border border-gray-200 bg-gray-50 p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Address</h2>
          <p className="text-sm text-gray-600">{request.address}</p>
        </div>
      )}

      <div className="border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 resize-y"
          placeholder="Add notes about this service request..."
        />
        <button
          type="button"
          onClick={handleSaveNotes}
          disabled={isUpdating}
          className="mt-3 text-sm font-medium text-green-600 hover:text-green-700"
        >
          {isUpdating ? 'Saving...' : 'Save notes'}
        </button>
      </div>
    </div>
  )
}
