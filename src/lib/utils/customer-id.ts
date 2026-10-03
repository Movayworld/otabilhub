export function generateCustomerId(uuid: string): string {
  const hex = uuid.replace(/-/g, '').slice(-6).toUpperCase()
  return `CUST-${hex}`
}

export function isValidCustomerId(id: string): boolean {
  return /^CUST-[0-9A-F]{6}$/i.test(id)
}

export function extractUuidFromCustomerId(customerId: string): string | null {
  const match = customerId.match(/^CUST-([0-9A-F]{6})$/i)
  if (!match) return null
  const hex = match[1].toLowerCase()
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}
