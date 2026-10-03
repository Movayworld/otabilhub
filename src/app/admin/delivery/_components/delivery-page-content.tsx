'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/layout/container'
import { Section } from '@/components/ui/section'
import { Button } from '@/components/ui/button'
import { Plus, Edit3, Trash2, Power, PowerOff } from 'lucide-react'
import { DeliveryForm } from './delivery-form'
import {
  deleteDeliveryLocation,
  getDeliveryLocationsData,
  toggleDeliveryLocationStatus,
} from '@/lib/actions/admin-delivery'
import type { Database } from '@/types/supabase'

type DeliveryLocation = Database['public']['Tables']['delivery_locations']['Row']

interface DeliveryPageContentProps {
  initialLocations: DeliveryLocation[]
}

export function DeliveryPageContent({ initialLocations }: DeliveryPageContentProps) {
  const router = useRouter()
  const [locations, setLocations] = useState<DeliveryLocation[]>(initialLocations)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingLocation, setEditingLocation] = useState<DeliveryLocation | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const refresh = async () => {
    const refreshed = await getDeliveryLocationsData()
    setLocations(refreshed)
  }

  const runAction = async (
    action: () => Promise<{ success: boolean; error?: string | null }>,
    successMessage: string
  ) => {
    setActionError(null)
    setFeedback(null)
    const result = await action()
    if (result.success) {
      setFeedback(successMessage)
      await refresh()
    } else {
      setActionError(result.error || 'The action could not be completed.')
    }
    return result
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    return runAction(
      () => toggleDeliveryLocationStatus(id, isActive),
      isActive ? 'Delivery location activated.' : 'Delivery location deactivated.'
    )
  }

  const handleDelete = async (id: string) => {
    return runAction(() => deleteDeliveryLocation(id), 'Delivery location deleted.')
  }

  const handleFormSuccess = async () => {
    setFeedback('Delivery location saved successfully.')
    setActionError(null)
    closeForm()
    await refresh()
  }

  const handleEdit = (loc: DeliveryLocation) => {
    setEditingId(loc.id)
    setEditingLocation(loc)
    setShowForm(true)
    setFeedback(null)
    setActionError(null)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setEditingLocation(null)
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Delivery Locations
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage delivery areas, fees, and estimated delivery times.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => { setEditingId(null); setEditingLocation(null); setShowForm(true); setFeedback(null); setActionError(null) }}
        >
          <Plus size={16} className="mr-2" />
          Add Location
        </Button>
      </div>

      {actionError && (
        <div className="mb-6 rounded-md bg-red-50 p-3" role="alert">
          <p className="text-sm text-red-600">{actionError}</p>
        </div>
      )}

      {feedback && (
        <div className="mb-6 rounded-md bg-green-50 p-3" role="status">
          <p className="text-sm text-green-700">{feedback}</p>
        </div>
      )}

      {showForm && (
        <div className="mb-8 border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingId ? 'Edit Location' : 'New Location'}
          </h2>
          <DeliveryForm
            editingId={editingId}
            initialData={editingLocation}
            onSuccess={handleFormSuccess}
            onCancel={closeForm}
          />
        </div>
      )}

      <div className="border border-gray-200 bg-white overflow-x-auto">
        {locations.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500">No delivery locations yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Location</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Region</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">City</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Delivery Fee</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Est. Delivery</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc) => (
                <tr key={loc.id} className="border-b border-gray-200">
                  <td className="py-3 px-4 font-medium text-gray-900">{loc.name}</td>
                  <td className="py-3 px-4 text-gray-600">{loc.region}</td>
                  <td className="py-3 px-4 text-gray-600">{loc.city}</td>
                  <td className="py-3 px-4 text-right text-gray-900">GHS {loc.delivery_fee.toFixed(2)}</td>
                  <td className="py-3 px-4 text-gray-600">{loc.estimated_delivery}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs px-2 py-1 rounded ${loc.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {loc.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggle(loc.id, !loc.is_active)}
                        title={loc.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {loc.is_active ? <Power size={14} /> : <PowerOff size={14} />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(loc)}
                        title="Edit"
                      >
                        <Edit3 size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(loc.id)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
