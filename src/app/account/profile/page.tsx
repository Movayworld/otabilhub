import { Suspense } from 'react'
import { AccountLayout } from '@/app/account/components/account-layout'
import { ProfileForm } from '@/app/account/profile/profile-form'
import { getCurrentProfile } from '@/lib/supabase/auth'
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

function ProfileFormSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-5 w-48 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded-md w-full"></div>
      </div>
      <div className="space-y-2">
        <div className="h-5 w-32 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded-md w-full"></div>
      </div>
      <div className="space-y-2">
        <div className="h-5 w-40 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded-md w-full"></div>
      </div>
    </div>
  )
}

async function ProfileFormLoader() {
  const profile = await getCurrentProfile()

  if (!profile) {
    return <p className="text-gray-600">Unable to load profile. Please try logging in again.</p>
  }

  return <ProfileForm profile={profile} />
}

export default function AccountProfilePage() {
  return (
    <AccountLayout currentPath="/account/profile">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">
          Profile
        </h1>

        <Suspense fallback={<ProfileFormSkeleton />}>
          <ProfileFormLoader />
        </Suspense>
      </div>
    </AccountLayout>
  )
}
