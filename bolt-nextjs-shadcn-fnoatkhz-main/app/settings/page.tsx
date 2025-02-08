"use client"

import { useAuth } from "@/hooks/use-auth"
import { ProfileSettings } from "@/components/profile/profile-settings"
import { NotificationsSettings } from "@/components/settings/notifications-settings"
import { PrivacySettings } from "@/components/settings/privacy-settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SettingsPage() {
  const { user } = useAuth()

  if (!user) {
    return null // Handle unauthorized access
  }

  return (
    <div className="container py-8">
      <h1 className="mb-8 text-3xl font-bold">Settings</h1>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSettings user={user} />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsSettings />
        </TabsContent>

        <TabsContent value="privacy">
          <PrivacySettings user={user} />
        </TabsContent>
      </Tabs>
    </div>
  )
}