"use client"

import { User } from "@supabase/supabase-js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUserDetails } from "@/hooks/use-user-details"

interface ProfileHeaderProps {
  user: User
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const { data: userDetails, isLoading } = useUserDetails(user.id)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={userDetails?.avatar_url} />
            <AvatarFallback>
              {userDetails?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{userDetails?.username || 'Anonymous User'}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">Member since</p>
            <p className="text-sm text-muted-foreground">
              {userDetails?.created_at ? new Date(userDetails.created_at).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Last seen</p>
            <p className="text-sm text-muted-foreground">
              {userDetails?.last_seen ? new Date(userDetails.last_seen).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Status</p>
            <p className="text-sm text-muted-foreground">
              {userDetails?.is_online ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}