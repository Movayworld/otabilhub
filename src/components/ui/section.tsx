import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Section({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn('w-full py-12 sm:py-16 lg:py-20', className)}
    >
      {children}
    </section>
  )
}
