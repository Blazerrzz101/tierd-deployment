"use client"

import { UserProfile } from "@/types/user"
import { ActivityFeed } from "./activity-feed"
import { ProfileSettings } from "./profile-settings"
import { PreferredAccessories } from "./preferred-accessories"

interface ProfileContentProps {
  user: UserProfile
}

export function ProfileContent({ user }: ProfileContentProps) {
  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr,320px]">
      <div className="space-y-8">
        <ActivityFeed user={user} />
        <ProfileSettings user={user} />
      </div>
      <aside>
        <PreferredAccessories user={user} />
      </aside>
    </div>
  )
}