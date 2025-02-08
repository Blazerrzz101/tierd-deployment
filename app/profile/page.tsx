"use client"

import { useAuth } from "@/hooks/use-auth"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProfilePage() {
  const { user, userDetails, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/sign-in')
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <Skeleton className="h-12 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <Skeleton className="h-4 w-[300px]" />
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user || !userDetails) {
    return null
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={userDetails.avatar_url || undefined} />
              <AvatarFallback>
                {userDetails.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{userDetails.username || 'Anonymous User'}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Member since</p>
              <p className="text-sm text-muted-foreground">
                {userDetails.created_at ? new Date(userDetails.created_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Last seen</p>
              <p className="text-sm text-muted-foreground">
                {userDetails.last_seen ? new Date(userDetails.last_seen).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-sm text-muted-foreground">
                {userDetails.is_online ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
