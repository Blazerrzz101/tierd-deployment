"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { getSupabaseClient } from "@/lib/supabase/client"

const profileSchema = z.object({
  display_name: z.string().min(2, "Display name must be at least 2 characters"),
  username: z.string().min(2, "Username must be at least 2 characters"),
  bio: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
})

const notificationSchema = z.object({
  email_notifications: z.boolean(),
  marketing_emails: z.boolean(),
  activity_digest: z.boolean(),
})

export default function SettingsPage() {
  const { user, updateProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = getSupabaseClient()

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: user?.display_name || "",
      username: user?.username || "",
      bio: user?.bio || "",
      website: user?.website || "",
    },
  })

  const notificationForm = useForm({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      email_notifications: true,
      marketing_emails: false,
      activity_digest: true,
    },
  })

  async function onProfileSubmit(values: z.infer<typeof profileSchema>) {
    try {
      setIsLoading(true)
      await updateProfile(values)
      toast.success("Profile updated successfully")
    } catch (error) {
      toast.error("Failed to update profile")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function onNotificationSubmit(values: z.infer<typeof notificationSchema>) {
    try {
      setIsLoading(true)
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user?.id,
          ...values,
        })

      if (error) throw error
      toast.success("Notification preferences updated")
    } catch (error) {
      toast.error("Failed to update notification preferences")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Please Sign In</CardTitle>
            <CardDescription>
              You need to be signed in to access settings.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile information and public details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      {...profileForm.register("display_name")}
                    />
                    {profileForm.formState.errors.display_name && (
                      <p className="text-sm text-red-500">
                        {profileForm.formState.errors.display_name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      {...profileForm.register("username")}
                    />
                    {profileForm.formState.errors.username && (
                      <p className="text-sm text-red-500">
                        {profileForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Input
                      id="bio"
                      {...profileForm.register("bio")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      {...profileForm.register("website")}
                    />
                    {profileForm.formState.errors.website && (
                      <p className="text-sm text-red-500">
                        {profileForm.formState.errors.website.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about your activity via email.
                      </p>
                    </div>
                    <Switch
                      checked={notificationForm.watch("email_notifications")}
                      onCheckedChange={(checked) => 
                        notificationForm.setValue("email_notifications", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about new features and promotions.
                      </p>
                    </div>
                    <Switch
                      checked={notificationForm.watch("marketing_emails")}
                      onCheckedChange={(checked) => 
                        notificationForm.setValue("marketing_emails", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Activity Digest</Label>
                      <p className="text-sm text-muted-foreground">
                        Get a weekly digest of your activity.
                      </p>
                    </div>
                    <Switch
                      checked={notificationForm.watch("activity_digest")}
                      onCheckedChange={(checked) => 
                        notificationForm.setValue("activity_digest", checked)
                      }
                    />
                  </div>

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Preferences"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how Tier'd looks on your device.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Toggle between light and dark mode.
                      </p>
                    </div>
                    <Switch
                      checked={user?.preferences?.theme === "dark"}
                      onCheckedChange={async (checked) => {
                        try {
                          await updateProfile({
                            preferences: {
                              ...user?.preferences,
                              theme: checked ? "dark" : "light"
                            }
                          })
                          toast.success("Theme updated")
                        } catch (error) {
                          toast.error("Failed to update theme")
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}