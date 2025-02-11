"use client"

import { useAuth } from "@/hooks/use-auth"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileActivity } from "@/components/profile/profile-activity"
import { ProfileSettings } from "@/components/profile/profile-settings"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { getUser } from "@/lib/supabase/server"

export default async function ProfilePage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/auth/sign-in')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileHeader user={user} />
      
      <Tabs defaultValue="activity" className="mt-8">
        <TabsList className="w-full">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-6">
          <Suspense fallback={<LoadingSpinner />}>
            <ProfileActivity userId={user.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Suspense fallback={<LoadingSpinner />}>
            <ProfileSettings user={user} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
