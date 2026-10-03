'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { saveHeroConfig, uploadHeroImage } from '@/lib/actions/admin-mutations'
import type { Database } from '@/types/supabase'
import { Upload } from 'lucide-react'

type HeroConfig = Database['public']['Tables']['hero_configs']['Row']

function HeroPreview({ config }: { config: Partial<HeroConfig> }) {
  return (
    <div className="border border-gray-200 bg-gray-50 p-8">
      <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-gray-100">
        {config.image_url ? (
          <img
            src={config.image_url}
            alt={config.image_alt || config.heading || 'Hero preview'}
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            No image
          </div>
        )}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-3xl font-bold">{config.heading || 'Hero Heading'}</h2>
            {config.subheading && (
              <p className="mt-4 max-w-md text-lg">{config.subheading}</p>
            )}
            {config.primary_cta_text && (
              <div className="mt-6">
                <span className="rounded-md bg-green-600 px-6 py-3 text-sm font-medium">
                  {config.primary_cta_text}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HeroForm({
  heroConfig,
}: {
  heroConfig: HeroConfig | null
}) {
  const router = useRouter()
  const [imageUrl, setImageUrl] = useState(heroConfig?.image_url || '')
  const [imageAlt, setImageAlt] = useState(heroConfig?.image_alt || '')
  const [heading, setHeading] = useState(heroConfig?.heading || '')
  const [subheading, setSubheading] = useState(heroConfig?.subheading || '')
  const [primaryCtaText, setPrimaryCtaText] = useState(heroConfig?.primary_cta_text || 'Shop Products')
  const [primaryCtaUrl, setPrimaryCtaUrl] = useState(heroConfig?.primary_cta_url || '/shop')
  const [secondaryCtaText, setSecondaryCtaText] = useState(heroConfig?.secondary_cta_text || '')
  const [secondaryCtaUrl, setSecondaryCtaUrl] = useState(heroConfig?.secondary_cta_url || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const previewConfig: Partial<HeroConfig> = {
    image_url: imageUrl,
    image_alt: imageAlt,
    heading,
    subheading,
    primary_cta_text: primaryCtaText,
    primary_cta_url: primaryCtaUrl,
    secondary_cta_text: secondaryCtaText,
    secondary_cta_url: secondaryCtaUrl,
  }

  const handleSave = async () => {
    if (!imageUrl || !heading || !primaryCtaText || !primaryCtaUrl) {
      setError('Image URL, heading, primary CTA text, and primary CTA URL are required.')
      setSuccess(false)
      return
    }
    setError(null)
    setSuccess(false)
    setIsSubmitting(true)

    const result = await saveHeroConfig({
      id: heroConfig?.id,
      image_url: imageUrl,
      image_alt: imageAlt || null,
      heading,
      subheading: subheading || null,
      primary_cta_text: primaryCtaText,
      primary_cta_url: primaryCtaUrl,
      secondary_cta_text: secondaryCtaText || null,
      secondary_cta_url: secondaryCtaUrl || null,
    })

    if (result.success) {
      setSuccess(true)
      router.refresh()
    } else if (result.error) {
      setError(result.error)
    }

    setIsSubmitting(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)
    setSuccess(false)
    const result = await uploadHeroImage(file)
    if (result.success && result.url) {
      setImageUrl(result.url)
      // Auto-save hero config with the new image
      const saveResult = await saveHeroConfig({
        id: heroConfig?.id,
        image_url: result.url,
        image_alt: imageAlt || null,
        heading: heading || 'Hero Heading',
        subheading: subheading || null,
        primary_cta_text: primaryCtaText,
        primary_cta_url: primaryCtaUrl,
        secondary_cta_text: secondaryCtaText || null,
        secondary_cta_url: secondaryCtaUrl || null,
      })
      if (saveResult.success) {
        setSuccess(true)
        router.refresh()
      } else if (saveResult.error) {
        setError(saveResult.error)
      }
    } else if (result.error) {
      setError(result.error)
    }
    setIsUploading(false)
  }

  return (
    <div>
      <div className="mb-8 flex items-baseline justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Homepage Hero
        </h1>
      </div>

      <div className="space-y-8">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Hero Image
          </label>
          <div className="flex items-center gap-4 mb-2">
            <label className="cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Upload size={16} className="mr-2 inline" />
              {isUploading ? 'Uploading...' : 'Upload image'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={handleImageUpload}
                disabled={isUploading}
              />
            </label>
          </div>
          {imageUrl && (
            <p className="text-sm text-gray-500">
              Current image set. Replace by uploading a new one.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Preview
          </label>
          <HeroPreview config={previewConfig} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="heading" className="block text-sm font-medium text-gray-900">
              Heading
            </label>
            <input
              type="text"
              id="heading"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
            />
          </div>

          <div>
            <label htmlFor="subheading" className="block text-sm font-medium text-gray-900">
              Subheading
            </label>
            <input
              type="text"
              id="subheading"
              value={subheading}
              onChange={(e) => setSubheading(e.target.value)}
              className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="primaryCtaText" className="block text-sm font-medium text-gray-900">
              Primary CTA Text
            </label>
            <input
              type="text"
              id="primaryCtaText"
              value={primaryCtaText}
              onChange={(e) => setPrimaryCtaText(e.target.value)}
              className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
            />
          </div>

          <div>
            <label htmlFor="primaryCtaUrl" className="block text-sm font-medium text-gray-900">
              Primary CTA URL
            </label>
            <input
              type="text"
              id="primaryCtaUrl"
              value={primaryCtaUrl}
              onChange={(e) => setPrimaryCtaUrl(e.target.value)}
              className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="secondaryCtaText" className="block text-sm font-medium text-gray-900">
              Secondary CTA Text (optional)
            </label>
            <input
              type="text"
              id="secondaryCtaText"
              value={secondaryCtaText}
              onChange={(e) => setSecondaryCtaText(e.target.value)}
              className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
            />
          </div>

          <div>
            <label htmlFor="secondaryCtaUrl" className="block text-sm font-medium text-gray-900">
              Secondary CTA URL (optional)
            </label>
            <input
              type="text"
              id="secondaryCtaUrl"
              value={secondaryCtaUrl}
              onChange={(e) => setSecondaryCtaUrl(e.target.value)}
              className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
            />
          </div>
        </div>

        <div>
          <label htmlFor="imageAlt" className="block text-sm font-medium text-gray-900">
            Image Alt Text
          </label>
          <input
            type="text"
            id="imageAlt"
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-3">
            <p className="text-sm text-green-700">Hero configuration saved.</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button variant="outline" size="sm" onClick={() => router.push('/admin')}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" disabled={isSubmitting} onClick={handleSave}>
            {isSubmitting ? 'Saving...' : 'Save Hero'}
          </Button>
        </div>
      </div>
    </div>
  )
}
