import CheckoutPage from './checkout-client'
import { getCurrentProfile } from '@/lib/supabase/auth'
import { getActiveDeliveryLocations } from '@/lib/queries/delivery'
import type { Database } from '@/types/supabase'

export default async function CheckoutRoute() {
  const profile = await getCurrentProfile()
  const locations = await getActiveDeliveryLocations()

  const prefill = {
    fullName: profile?.full_name || '',
    phone: profile?.phone || '',
    email: profile?.email || '',
    address: profile?.address || '',
    city: profile?.city || '',
  }

  return <CheckoutPage prefill={prefill} deliveryLocations={locations} />
}
