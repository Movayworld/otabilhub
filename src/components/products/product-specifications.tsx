import { cn } from '@/lib/utils'

type SpecificationValue = string | number | boolean | null

interface ProductSpecificationsProps {
  specifications: Record<string, unknown> | null | undefined
  className?: string
}

function formatSpecValue(value: SpecificationValue): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return value.toString()
    return value.toFixed(2)
  }
  return String(value)
}

function isRecord(
  obj: unknown
): obj is Record<string, SpecificationValue> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    !Array.isArray(obj)
  )
}

export function ProductSpecifications({
  specifications,
  className,
}: ProductSpecificationsProps) {
  if (!specifications || !isRecord(specifications)) {
    return null
  }

  const entries = Object.entries(specifications).filter(
    ([, v]) => v !== null && v !== undefined
  )

  if (entries.length === 0) {
    return null
  }

  return (
    <div className={cn('mt-8', className)}>
      <h3 className="text-sm font-medium uppercase tracking-wider text-gray-900">
        Specifications
      </h3>
      <div className="mt-4 divide-y divide-gray-200">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="flex justify-between py-2 text-sm"
          >
            <dt className="text-gray-600">{key}</dt>
            <dd className="text-right font-medium text-gray-900">
              {formatSpecValue(value as SpecificationValue)}
            </dd>
          </div>
        ))}
      </div>
    </div>
  )
}
