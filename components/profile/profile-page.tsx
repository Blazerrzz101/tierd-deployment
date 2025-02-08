"use client"

import { UserProfile } from "@/types/user"
import { ProfileHeader } from "./profile-header"
import { ProfileContent } from "./profile-content"

interface ProfilePageProps {
  user: UserProfile
}

export function ProfilePage({ user }: ProfilePageProps) {
  return (
    <div className="container max-w-6xl py-8">
      <ProfileHeader user={user} isOwnProfile={false} />
      <ProfileContent user={user} />
    </div>
  )
}