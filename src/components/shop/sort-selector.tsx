'use client'

import { ChevronDown } from 'lucide-react'

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
]

export function SortSelector({
  currentSort,
}: {
  currentSort: string | null
}) {
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(window.location.search)
    params.set('sort', e.target.value)
    window.location.search = params.toString()
  }

  return (
    <div className="mb-6 flex items-center justify-end">
      <select
        name="sort"
        value={currentSort ?? 'featured'}
        onChange={handleSortChange}
        className="text-sm text-gray-700 border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#1677FF]"
        aria-label="Sort products"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="ml-1 h-3 w-3 text-gray-400" />
    </div>
  )
}

