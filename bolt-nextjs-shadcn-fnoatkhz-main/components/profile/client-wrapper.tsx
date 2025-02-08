"use client"

import { useState } from "react"
import { UserProfile } from "@/types/user"
import { ProfileHeader } from "./profile-header"
import { ActivityFeed } from "./activity-feed"
import { PreferredAccessories } from "./preferred-accessories"
import { ProfileSettings } from "./profile-settings"

interface ClientWrapperProps {
  initialUser: UserProfile
}

export function ClientWrapper({ initialUser }: ClientWrapperProps) {
  const [user] = useState(initialUser)

  return (
    <div className="container max-w-6xl py-8">
      <ProfileHeader user={user} isOwnProfile={false} />
      
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr,320px]">
        <div className="space-y-8">
          <ActivityFeed user={user} />
          <ProfileSettings user={user} />
        </div>
        <aside>
          <PreferredAccessories user={user} />
        </aside>
      </div>
    </div>
  )
}