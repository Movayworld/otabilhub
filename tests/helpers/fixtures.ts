import { test as base } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

export type EnvVars = {
  E2E_ADMIN_EMAIL: string
  E2E_ADMIN_PASSWORD: string
  E2E_USER_EMAIL: string
  E2E_USER_PASSWORD: string
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  E2E_TEST_PRODUCT_ID: string
}

export function loadEnv(): EnvVars {
  const envPath = path.resolve(__dirname, '..', '..', '.env.e2e')
  const env: Record<string, string> = {}

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex).trim()
        const value = trimmed.substring(eqIndex + 1).trim()
        env[key] = value
      }
    }
  }

  return {
    E2E_ADMIN_EMAIL: env.E2E_ADMIN_EMAIL || '',
    E2E_ADMIN_PASSWORD: env.E2E_ADMIN_PASSWORD || '',
    E2E_USER_EMAIL: env.E2E_USER_EMAIL || '',
    E2E_USER_PASSWORD: env.E2E_USER_PASSWORD || '',
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    E2E_TEST_PRODUCT_ID: env.E2E_TEST_PRODUCT_ID || '9201ca63-2787-461c-987b-7a2a813903a2',
  }
}

export const test = base.extend<{ env: EnvVars }>({
  env: async ({}, use) => {
    const env = loadEnv()
    await use(env)
  },
})

export { expect } from '@playwright/test'
