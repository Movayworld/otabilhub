import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    service_type,
    description,
    customer_name,
    customer_email,
    customer_phone,
    address,
    price,
  } = body

  if (!service_type || typeof service_type !== 'string') {
    return NextResponse.json(
      { error: 'Service type is required', success: false },
      { status: 400 }
    )
  }

  try {
    const service = createServiceClient()

    const notesParts = [
      description,
      customer_name ? `Customer: ${customer_name}` : null,
      customer_email ? `Email: ${customer_email}` : null,
      customer_phone ? `Phone: ${customer_phone}` : null,
    ].filter(Boolean)

    const { data, error } = await service
      .from('service_requests')
      .insert({
        service_type: service_type.trim(),
        notes: notesParts.join('\n'),
        address: address || null,
        price: price || null,
        status: 'pending',
      })
      .select('id, service_type, status, created_at')
      .single()

    if (error) {
      console.error('Service request creation failed:', error)
      const isDuplicate = error.message?.toLowerCase().includes('already') || false
      return NextResponse.json(
        {
          error: isDuplicate ? 'A similar request already exists.' : 'Failed to create service request.',
          success: false,
          isDuplicate,
        },
        { status: isDuplicate ? 409 : 500 }
      )
    }

    return NextResponse.json({ success: true, id: data.id }, { status: 201 })
  } catch (err) {
    console.error('Service request API exception:', err)
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}
