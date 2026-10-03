'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Image as ImageIcon, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { uploadBrandingIcon } from '@/lib/actions/admin-branding'

interface BrandingFormProps {
  initialIcon: string | null
}

const ALLOWED_MIME = ['image/png', 'image/x-icon', 'image/jpeg', 'image/jpg']
const MAX_SIZE = 2 * 1024 * 1024

export default function BrandingForm({ initialIcon }: BrandingFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialIcon)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setError(null)
    setSuccess(false)

    if (!file) return

    if (!ALLOWED_MIME.includes(file.type)) {
      setError('Invalid file type. Please upload a PNG, JPEG, or ICO file.')
      setSelectedFile(null)
      setPreviewUrl(null)
      return
    }

    if (file.size > MAX_SIZE) {
      setError('File size must be under 2 MB.')
      setSelectedFile(null)
      setPreviewUrl(null)
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError(null)
    setSuccess(false)

    const result = await uploadBrandingIcon(selectedFile)

    if (result.success) {
      setSuccess(true)
      setPreviewUrl(result.path || null)
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    } else if (result.error) {
      setError(result.error)
    }

    setIsUploading(false)
  }

  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-3">
          Favicon / App Icon
        </label>

        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Icon preview"
                className="h-24 w-24 rounded-lg border border-gray-200 bg-white object-contain"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-400">
                <ImageIcon size={40} />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <input
                type="file"
                accept="image/png,image/x-icon"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-gray-100 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
              />
            </div>

            <p className="text-xs text-gray-500">
              Accepted: PNG, ICO. Max size: 2 MB. A 32&times;32 or larger icon is recommended.
            </p>

            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!selectedFile || isUploading}
              onClick={handleUpload}
            >
              {isUploading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} className="mr-2" />
                  Upload Icon
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-md bg-red-50 p-3">
            <AlertCircle size={16} className="text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-3 flex items-center gap-2 rounded-md bg-green-50 p-3">
            <CheckCircle size={16} className="text-green-600" />
            <p className="text-sm text-green-800">Icon uploaded successfully.</p>
          </div>
        )}
      </div>

      {previewUrl && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Preview
          </label>
          <div className="border border-gray-200 bg-white p-4 inline-block rounded-lg">
            <img
              src={previewUrl}
              alt="Active icon preview"
              className="h-16 w-16 object-contain"
            />
            <p className="mt-2 text-xs text-gray-500 text-center">Active icon</p>
          </div>
        </div>
      )}
    </div>
  )
}
