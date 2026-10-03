'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createProduct, updateProduct, deleteProduct, uploadProductImage, setPrimaryImage, deleteProductImage } from '@/lib/actions/admin-mutations'
import type { Database } from '@/types/supabase'
import { Upload } from 'lucide-react'

type ProductWithImages = Database['public']['Tables']['products']['Row'] & {
  product_images: Database['public']['Tables']['product_images']['Row'][]
}

type Category = Database['public']['Tables']['categories']['Row']

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
// Mirrors the product-images storage bucket file_size_limit (10 MB).
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

interface ProductFormProps {
  product: ProductWithImages | null
  categories: Category[]
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadNotice, setUploadNotice] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description ?? '',
    short_description: product?.short_description ?? '',
    price: product ? Number(product.price) : 0,
    compare_at_price: product?.compare_at_price ? Number(product.compare_at_price) : '',
    stock_quantity: product ? product.stock_quantity : 0,
    is_available: product?.is_available ?? true,
    is_featured: product?.is_featured ?? false,
    is_published: product?.is_published ?? false,
    category_id: product?.category_id || '',
    card_layout: (product?.specifications as Record<string, unknown> | null)?._card_layout as 'standard' | 'featured' | 'compact' | 'minimal' | 'overlay' | 'horizontal-card' || 'standard',
    homepage_layout: (product?.specifications as Record<string, unknown> | null)?._homepage_layout as 'horizontal' | 'vertical' || 'vertical',
    specifications: typeof product?.specifications === 'string'
      ? product.specifications
      : JSON.stringify(product?.specifications || {}, null, 2),
  })

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Product name is required'
    if (!formData.slug.trim()) newErrors.slug = 'Slug is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (formData.price < 0) newErrors.price = 'Price must be >= 0'
    if (formData.stock_quantity < 0) newErrors.stock_quantity = 'Stock must be >= 0'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!validate()) return

    setIsSubmitting(true)

    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim(),
        short_description: formData.short_description.trim(),
        price: formData.price,
        compare_at_price: formData.compare_at_price ? Number(formData.compare_at_price) : null,
        stock_quantity: formData.stock_quantity,
        is_available: formData.is_available,
        is_featured: formData.is_featured,
        is_published: formData.is_published,
        category_id: formData.category_id || null,
        card_layout: formData.card_layout,
        homepage_layout: formData.homepage_layout,
        specifications: formData.specifications ? JSON.parse(formData.specifications) : {},
      }

      const result = product
        ? await updateProduct(product.id, { ...payload, id: product.id })
        : await createProduct(payload)

      if (result.success) {
        const productId = (result as { id?: string }).id
        if (product) {
          router.push('/admin/products')
        } else {
          router.push(`/admin/products/${productId}`)
        }
        router.refresh()
      } else if (result.error) {
        setSubmitError(result.error)
      }
    } catch (err) {
      setSubmitError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    // Reset so selecting the same file again re-triggers onChange.
    e.target.value = ''
    if (files.length === 0) return

    setSubmitError(null)
    setUploadNotice(null)

    if (!product) {
      setSubmitError('Please save the product first before uploading images.')
      return
    }

    const rejected: string[] = []
    const accepted: File[] = []
    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        rejected.push(`${file.name}: unsupported file type. Use a JPEG, PNG, WebP, or GIF image.`)
        continue
      }
      if (file.size > MAX_IMAGE_BYTES) {
        rejected.push(`${file.name}: file is larger than 10 MB.`)
        continue
      }
      accepted.push(file)
    }

    if (accepted.length === 0) {
      setSubmitError(rejected.join(' '))
      return
    }

    setIsUploading(true)
    let uploaded = 0
    const failures: string[] = []
    for (const file of accepted) {
      const result = await uploadProductImage(product.id, file)
      if (result.success) {
        uploaded += 1
      } else {
        failures.push(`${file.name}: ${result.error ?? 'upload failed'}`)
      }
    }
    setIsUploading(false)

    const problems = [...rejected, ...failures]
    if (problems.length > 0) {
      setSubmitError(problems.join(' '))
    }
    if (uploaded > 0) {
      setUploadNotice(uploaded === 1 ? 'Image uploaded.' : `${uploaded} images uploaded.`)
      router.refresh()
    }
  }

  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!product) return
    if (!confirm('Delete this product? Its images will be removed too. This cannot be undone.')) {
      return
    }
    setIsDeleting(true)
    setSubmitError(null)
    const result = await deleteProduct(product.id)
    if (result.success) {
      router.push('/admin/products')
      router.refresh()
    } else {
      setSubmitError(result.error ?? 'Failed to delete the product.')
    }
    setIsDeleting(false)
  }

  const handleSetPrimary = async (imageId: string) => {
    if (!product) return
    setUploadNotice(null)
    setSubmitError(null)
    const result = await setPrimaryImage(product.id, imageId)
    if (result.success) {
      setUploadNotice('Primary image updated.')
      router.refresh()
    } else {
      setSubmitError(result.error ?? 'Failed to set the primary image.')
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!product) return
    if (!confirm('Delete this image? This cannot be undone.')) return
    setUploadNotice(null)
    setSubmitError(null)
    const result = await deleteProductImage(imageId, product.id)
    if (result.success) {
      setUploadNotice('Image deleted.')
      router.refresh()
    } else {
      setSubmitError(result.error ?? 'Failed to delete the image.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-900">
          Product name
        </label>
        <input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-900">
          Slug
        </label>
        <input
          type="text"
          id="slug"
          required
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
        />
        {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-900">
          Price (GHS)
        </label>
        <input
          type="number"
          id="price"
          step="0.01"
          min="0"
          required
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
        />
        {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
      </div>

      <div>
        <label htmlFor="compare_at_price" className="block text-sm font-medium text-gray-900">
          Compare at price (GHS, optional)
        </label>
        <input
          type="number"
          id="compare_at_price"
          step="0.01"
          min="0"
          value={formData.compare_at_price}
          onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value ? e.target.value : '' })}
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
        />
      </div>

      <div>
        <label htmlFor="stock_quantity" className="block text-sm font-medium text-gray-900">
          Stock quantity
        </label>
        <input
          type="number"
          id="stock_quantity"
          min="0"
          required
          value={formData.stock_quantity}
          onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
        />
        {errors.stock_quantity && <p className="mt-1 text-sm text-red-600">{errors.stock_quantity}</p>}
      </div>

      <div>
        <label htmlFor="category_id" className="block text-sm font-medium text-gray-900">
          Category
        </label>
        <select
          id="category_id"
          value={formData.category_id}
          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
        >
          <option value="">No category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_available"
          checked={formData.is_available}
          onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
          className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-600"
        />
        <label htmlFor="is_available" className="text-sm font-medium text-gray-900">
          Is available
        </label>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_featured"
          checked={formData.is_featured}
          onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
          className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-600"
        />
        <label htmlFor="is_featured" className="text-sm font-medium text-gray-900">
          Is featured
        </label>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_published"
          checked={formData.is_published}
          onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
          className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-600"
        />
        <label htmlFor="is_published" className="text-sm font-medium text-gray-900">
          Is published (visible on storefront)
        </label>
      </div>

      <div>
        <label htmlFor="card_layout" className="block text-sm font-medium text-gray-900">
          Product card layout
        </label>
        <select
          id="card_layout"
          value={formData.card_layout}
            onChange={(e) => setFormData({ ...formData, card_layout: e.target.value as 'standard' | 'featured' | 'compact' | 'minimal' | 'overlay' | 'horizontal-card' })}
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
        >
          <option value="standard">Standard — classic card</option>
          <option value="featured">Featured — larger card with badges</option>
          <option value="compact">Compact — minimal card</option>
          <option value="minimal">Minimal — text-only card with small image</option>
          <option value="overlay">Overlay — image with text overlay</option>
          <option value="horizontal-card">Horizontal — side-by-side image and details</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">How this product appears in product listings.</p>
      </div>

      <div>
        <label htmlFor="homepage_layout" className="block text-sm font-medium text-gray-900">
          Homepage layout
        </label>
        <select
          id="homepage_layout"
          value={formData.homepage_layout}
          onChange={(e) => setFormData({ ...formData, homepage_layout: e.target.value as 'horizontal' | 'vertical' })}
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
        >
          <option value="vertical">Vertical — stacked cards</option>
          <option value="horizontal">Horizontal — side-by-side cards</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">How this product appears in homepage product grids.</p>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-900">
          Description
        </label>
        <textarea
          id="description"
          rows={5}
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 resize-y"
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>

      <div>
        <label htmlFor="short_description" className="block text-sm font-medium text-gray-900">
          Short description
        </label>
        <textarea
          id="short_description"
          rows={3}
          value={formData.short_description}
          onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 resize-y"
        />
      </div>

      <div>
        <label htmlFor="specifications" className="block text-sm font-medium text-gray-900">
          Specifications (JSON)
        </label>
        <textarea
          id="specifications"
          rows={4}
          placeholder='{"key": "value"}'
          value={formData.specifications}
          onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 resize-y font-mono"
        />
        <p className="mt-1 text-xs text-gray-500">
          Enter product specifications as valid JSON.
        </p>
      </div>

      {product && product.product_images.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Product Images
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {product.product_images.map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.image_url}
                  alt={img.alt_text || product.name}
                  className="h-24 w-full rounded object-cover object-center"
                />
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(img.id)}
                    disabled={img.is_primary}
                    className={`text-xs px-2 py-1 rounded ${
                      img.is_primary
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {img.is_primary ? 'Primary' : 'Set Primary'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(img.id)}
                    className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Product Images
        </label>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Upload size={16} className="mr-2 inline" />
            {isUploading ? 'Uploading...' : 'Choose file'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              hidden
              onChange={handleImageUpload}
              disabled={isUploading}
            />
          </label>
        </div>
        {uploadNotice && (
          <p className="mt-1 text-xs text-green-700" role="status">
            {uploadNotice}
          </p>
        )}
        {product && product.product_images.length > 0 && (
          <p className="mt-1 text-xs text-gray-500">
            Upload additional images. Current images shown above.
          </p>
        )}
      </div>

      {submitError && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-gray-200">
          {product ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting || isSubmitting || isUploading}
                className="text-red-600 hover:text-red-700"
              >
                {isDeleting ? 'Deleting...' : 'Delete Product'}
              </Button>
              {product.is_published && (
                <Link href={`/shop/${product.slug}`}>
                  <Button type="button" variant="outline" size="sm">
                    View on Storefront
                  </Button>
                </Link>
              )}
            </>
          ) : (
            <span />
          )}
          <div className="flex justify-end gap-3">
            <Link href="/admin/products">
              <Button type="button" variant="outline" size="sm">
                Cancel
              </Button>
            </Link>
            <Button variant="primary" size="sm" disabled={isSubmitting || isUploading}>
              {isSubmitting ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </div>
    </form>
  )
}
