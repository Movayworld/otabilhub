'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { updateProfile } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

interface FormErrors {
  fullName?: string
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const [fullName, setFullName] = useState(profile.full_name || '')
  const [phone, setPhone] = useState(profile.phone || '')
  const [address, setAddress] = useState(profile.address || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [serverSuccess, setServerSuccess] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setServerError(null)
    setServerSuccess(null)

    const errors: FormErrors = {}

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required.'
    } else if (fullName.trim().length > 100) {
      errors.fullName = 'Full name is too long.'
    }

    setFormErrors(errors)

    if (Object.keys(errors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      })

      if (result.success) {
        setServerSuccess('Profile updated successfully.')
        router.refresh()
      } else if (result.error) {
        setServerError(result.error)
      }
    } catch {
      setServerError('Unable to update profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-900"
        >
          Email address
        </label>
        <div className="mt-1">
          <input
            type="email"
            id="email"
            value={profile.email}
            disabled
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 bg-gray-50 cursor-not-allowed"
            aria-label="Email address (read-only)"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Email cannot be changed from here.
        </p>
      </div>

      <div>
        <label
          htmlFor="fullName"
          className="block text-sm font-medium text-gray-900"
        >
          Full name
        </label>
        <input
          type="text"
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1677FF] focus:border-[#1677FF]"
          autoComplete="name"
          maxLength={100}
          aria-invalid={!!formErrors.fullName}
          aria-describedby={formErrors.fullName ? 'fullName-error' : undefined}
        />
        {formErrors.fullName && (
          <p id="fullName-error" className="mt-1 text-sm text-red-600">
            {formErrors.fullName}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-900"
        >
          Phone number
        </label>
        <input
          type="tel"
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1677FF] focus:border-[#1677FF]"
          autoComplete="tel"
          maxLength={20}
          placeholder="+233 20 000 0000"
        />
      </div>

      <div>
        <label
          htmlFor="address"
          className="block text-sm font-medium text-gray-900"
        >
          Address
        </label>
        <textarea
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1677FF] focus:border-[#1677FF] resize-y"
          autoComplete="street-address"
          maxLength={500}
          rows={4}
          placeholder="Full delivery address"
        />
      </div>

      {serverError && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-600">{serverError}</p>
        </div>
      )}

      {serverSuccess && (
        <div className="rounded-md bg-[#E6F0FF] p-3">
          <p className="text-sm text-[#0B3D91]">{serverSuccess}</p>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-gray-200 pt-6">
        <Link href="/account">
          <Button variant="secondary" type="button">
            Cancel
          </Button>
        </Link>

        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Saving...
            </span>
          ) : (
            'Save changes'
          )}
        </Button>
      </div>
    </form>
  )
}

