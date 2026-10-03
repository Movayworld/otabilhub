'use client'

import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuantitySelectorProps {
  quantity: number
  maxAvailable: number
  onChange: (quantity: number) => void
  available: boolean
}

export function QuantitySelector({
  quantity,
  maxAvailable,
  onChange,
  available,
}: QuantitySelectorProps) {
  const handleDecrease = () => {
    if (!available) return
    onChange(Math.max(1, quantity - 1))
  }

  const handleIncrease = () => {
    if (!available) return
    onChange(Math.min(quantity + 1, maxAvailable))
  }

  const canIncrease = available && quantity < maxAvailable
  const canDecrease = available && quantity > 1

  const buttonClasses =
    'inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleDecrease}
        disabled={!canDecrease}
        className={cn(buttonClasses, 'hover:bg-gray-50')}
        aria-label="Decrease quantity"
      >
        <Minus size={14} />
      </button>

      <span
        className="w-10 text-center text-sm font-medium text-gray-900"
        aria-live="polite"
      >
        {quantity}
      </span>

      <button
        type="button"
        onClick={handleIncrease}
        disabled={!canIncrease}
        className={cn(buttonClasses, 'hover:bg-gray-50')}
        aria-label="Increase quantity"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
