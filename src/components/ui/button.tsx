import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#1677FF] text-white hover:bg-[#0B3D91] focus-visible:ring-2 focus-visible:ring-[#1677FF] focus-visible:ring-offset-2',
  secondary:
    'bg-transparent text-[#1677FF] hover:bg-[#1677FF]/10 focus-visible:ring-2 focus-visible:ring-[#1677FF] focus-visible:ring-offset-2',
  accent:
    'bg-[#1677FF] text-white hover:bg-[#0B3D91] focus-visible:ring-2 focus-visible:ring-[#1677FF] focus-visible:ring-offset-2',
  outline:
    'border border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2',
  ghost:
    'text-gray-700 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  asChild = false,
  ...props
}: ButtonProps) {
  const baseClasses = cn(
    'inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
    variantClasses[variant],
    sizeClasses[size],
    className
  )

  if (asChild) {
    return (
      <span className={baseClasses} data-slot="button">
        {children}
      </span>
    )
  }

  return (
    <button className={baseClasses} {...props}>
      {children}
    </button>
  )
}
