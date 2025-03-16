"use client"

import { UserProfile } from "@/types/user"
import { ProfileHeader } from "./profile-header"
import { ActivityFeed } from "./activity-feed"
import { PreferredAccessories } from "./preferred-accessories"
import { ProfileSettings } from "./profile-settings"

interface ProfileLayoutProps {
  user: UserProfile
}

export function ProfileLayout({ user }: ProfileLayoutProps) {
  return (
    <div className="container max-w-6xl py-8">
      <ProfileHeader user={user} isOwnProfile={false} />
      
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr,320px]">
        <div className="space-y-8">
          <ProfileSettings user={user} />
          <ActivityFeed user={user} />
        </div>
        <div className="space-y-8">
          <PreferredAccessories user={user} />
        </div>
      </div>
    </div>
  )
}