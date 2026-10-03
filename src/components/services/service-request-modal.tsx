'use client'

import { useState } from 'react'
import { Container } from '@/components/layout/container'
import { Section } from '@/components/ui/section'
import { Button } from '@/components/ui/button'
import { createServiceRequest, type ServiceRequestFormData } from '@/lib/actions/service-requests'
import { X, Wrench, MapPin, Calendar, MessageSquare } from 'lucide-react'

interface ServiceRequestModalProps {
  isOpen: boolean
  onClose: () => void
  productName?: string
}

export function ServiceRequestModal({
  isOpen,
  onClose,
  productName,
}: ServiceRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState<ServiceRequestFormData>({
    serviceType: 'Installation',
    productName: productName || '',
    phone: '',
    address: '',
    preferredDate: '',
    notes: '',
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await createServiceRequest(formData)
      if (result.success) {
        setSubmitted(true)
      } else if (result.error) {
        setError(result.error)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } catch {
      setError('Failed to submit your request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
        <div className="w-full max-w-md rounded-lg bg-white p-8 mx-4">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Wrench size={24} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Request received</h2>
            <p className="mt-2 text-sm text-gray-600">
              Thank you for your installation request. OtabilHub will contact you shortly to schedule the service.
            </p>
            <Button
              variant="primary"
              className="mt-6"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg rounded-lg bg-white p-8 mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Request Installation</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="serviceType" className="block text-sm font-medium text-gray-900">
              Service Type
            </label>
            <select
              id="serviceType"
              value={formData.serviceType}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
              className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
            >
              <option value="Installation">Installation</option>
              <option value="Setup">Setup</option>
              <option value="Repair">Repair</option>
              <option value="Consultation">Consultation</option>
            </select>
          </div>

          {productName && (
            <div>
              <label className="block text-sm font-medium text-gray-900">Product</label>
              <p className="mt-1 text-sm text-gray-600">{productName}</p>
            </div>
          )}

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-900">
              Phone number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-900">
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              id="address"
              rows={3}
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 resize-y"
            />
          </div>

          <div>
            <label htmlFor="preferredDate" className="block text-sm font-medium text-gray-900">
              Preferred Date <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="date"
              id="preferredDate"
              value={formData.preferredDate}
              onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
              className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-900">
              Additional Notes <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 resize-y"
              placeholder="Any special requirements or details..."
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center">
                  <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Submitting...
                </span>
              ) : (
                <span className="flex items-center">
                  <MapPin size={16} className="mr-2" />
                  Submit Request
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
