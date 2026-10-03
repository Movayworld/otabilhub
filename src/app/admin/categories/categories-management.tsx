'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createCategory, updateCategory, deleteCategory } from '@/lib/actions/admin-mutations'
import type { Database } from '@/types/supabase'

type Category = Database['public']['Tables']['categories']['Row']

interface CategoryFormProps {
  category?: Category | null
  onSaved: () => void
  onCancel: () => void
}

function CategoryForm({ category, onSaved, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(category?.name || '')
  const [slug, setSlug] = useState(category?.slug || '')
  const [description, setDescription] = useState(category?.description || '')
  const [isActive, setIsActive] = useState(category?.is_active ?? true)
  const [displayMode, setDisplayMode] = useState<'grid' | 'horizontal'>(
    (category?.display_mode as 'grid' | 'horizontal') || 'grid'
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const result = category
      ? await updateCategory(category.id, { name: name.trim(), slug: slug.trim(), description: description.trim() || undefined, is_active: isActive, display_mode: displayMode })
      : await createCategory({ name: name.trim(), slug: slug.trim(), description: description.trim() || undefined, display_mode: displayMode })

    if (result.success) {
      onSaved()
    } else if (result.error) {
      setError(result.error)
    }

    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-900">
          Name
        </label>
        <input
          type="text"
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-900">
          Slug
        </label>
        <input
          type="text"
          id="slug"
          required
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-900">
          Description (optional)
        </label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 resize-y"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_active"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-600"
        />
        <label htmlFor="is_active" className="text-sm font-medium text-gray-900">
          Active
        </label>
      </div>

      <div>
        <label htmlFor="display_mode" className="block text-sm font-medium text-gray-900">
          Homepage Display Mode
        </label>
        <select
          id="display_mode"
          value={displayMode}
          onChange={(e) => setDisplayMode(e.target.value as 'grid' | 'horizontal')}
          className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
        >
          <option value="grid">Grid (2-column on mobile)</option>
          <option value="horizontal">Horizontal Swipe (carousel)</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Grid shows products in a responsive grid; Horizontal Swipe shows products in a
          scrollable carousel rail.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : category ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}

export default function CategoriesManagement({
  categories,
}: {
  categories: Category[]
}) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)

  const handleSaved = () => {
    setShowNew(false)
    setEditingId(null)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? This cannot be undone.')) return
    await deleteCategory(id)
    router.refresh()
  }

  if (showNew || editingId) {
    const category = editingId ? categories.find(c => c.id === editingId) : null
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {editingId ? 'Edit Category' : 'New Category'}
        </h2>
        <CategoryForm
          category={category}
          onSaved={handleSaved}
          onCancel={() => {
            setShowNew(false)
            setEditingId(null)
          }}
        />
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="text-sm font-medium text-green-600 hover:text-green-700"
        >
          + Create first category
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="text-sm font-medium text-green-600 hover:text-green-700"
        >
          + New category
        </button>
      </div>

      <div className="space-y-2">
        {categories.map((category) => (
          <div
            key={category.id}
            data-testid="category-row"
            className="flex items-center justify-between border-b border-gray-200 py-3"
          >
            <div>
              <p className="font-medium text-gray-900">{category.name}</p>
              <p className="text-sm text-gray-500">/{category.slug}</p>
              {category.description && (
                <p className="text-sm text-gray-600 mt-1">{category.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
               <span className={`text-xs px-2 py-1 rounded ${
                category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {category.is_active ? 'Active' : 'Inactive'}
              </span>
              <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                {category.display_mode === 'horizontal' ? 'Swipe' : 'Grid'}
              </span>
              <button
                type="button"
                onClick={() => setEditingId(category.id)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(category.id)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
