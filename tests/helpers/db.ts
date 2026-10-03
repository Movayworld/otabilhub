import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type DbEnv = {
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  E2E_ADMIN_EMAIL: string
  E2E_ADMIN_PASSWORD: string
  E2E_USER_EMAIL: string
  E2E_USER_PASSWORD: string
}

/**
 * An anonymous Supabase client using only the PUBLIC anon key.
 * Safe to use from tests: it carries no elevated privileges and is
 * subject to the same RLS policies as the storefront.
 */
export function anonDbClient(env: DbEnv): SupabaseClient {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

type Credentials = { email: string; password: string }

async function signInWithRetry(
  client: SupabaseClient,
  credentials: Credentials,
  attempts = 3
): Promise<void> {
  let lastError: string | null = null
  for (let i = 0; i < attempts; i++) {
    const { error } = await client.auth.signInWithPassword(credentials)
    if (!error) return
    lastError = error.message
    await new Promise((resolve) => setTimeout(resolve, 1500 * (i + 1)))
  }
  throw new Error(`Sign-in failed after ${attempts} attempts: ${lastError}`)
}

/**
 * A Supabase client authenticated as the E2E admin user.
 * Subject to RLS exactly like the admin UI (is_admin() policies).
 * NEVER uses the service role key.
 */
export async function adminDbClient(env: DbEnv): Promise<SupabaseClient> {
  if (!env.E2E_ADMIN_EMAIL || !env.E2E_ADMIN_PASSWORD) {
    throw new Error('E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD must be set in .env.e2e')
  }
  const client = anonDbClient(env)
  await signInWithRetry(client, { email: env.E2E_ADMIN_EMAIL, password: env.E2E_ADMIN_PASSWORD })
  return client
}

/**
 * A Supabase client authenticated as a regular (non-admin) user.
 * Used for authorization tests that must prove non-admins are blocked.
 */
export async function userDbClient(env: DbEnv): Promise<SupabaseClient> {
  if (!env.E2E_USER_EMAIL || !env.E2E_USER_PASSWORD) {
    throw new Error('E2E_USER_EMAIL and E2E_USER_PASSWORD must be set in .env.e2e')
  }
  const client = anonDbClient(env)
  await signInWithRetry(client, { email: env.E2E_USER_EMAIL, password: env.E2E_USER_PASSWORD })
  return client
}
