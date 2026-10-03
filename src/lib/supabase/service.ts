import { createClient as createSupabaseClient, type SupabaseClientOptions } from '@supabase/supabase-js'

// Privileged server-only client for operations that must bypass RLS
// (guest checkout, admin lifecycle mutations). The secret key can be
// either a legacy service_role JWT or a new-format `sb_secret_` key.
//
// Legacy JWT: keep the publishable/anon key as the `apikey` header and
// send the service JWT as the bearer token.
// New `sb_secret_` key: send it as both the `apikey` header and bearer
// token (it is not a JWT, so it must be sent as the API key).
//
// NEVER import this module into client components.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const secret = process.env.SUPABASE_SECRET_KEY

  if (!secret) {
    throw new Error('SUPABASE_SECRET_KEY is not configured')
  }

  const isJwt = secret.split('.').length === 3
  const apiKey = isJwt ? anonKey : secret

  const client = createSupabaseClient(url, apiKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    fetch: (input: RequestInfo | URL, options?: RequestInit) => {
      const headers = new Headers(options?.headers)
      headers.set('apikey', apiKey)
      headers.set('Authorization', `Bearer ${secret}`)
      return fetch(input, { ...options, headers })
    },
  } as SupabaseClientOptions<'public'>)

  return client
}
