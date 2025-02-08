"use client"

import { User } from "@supabase/auth-helpers-nextjs"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface SettingsContentProps {
  user: User
  preferences?: {
    id: string
    email_notifications: boolean
    theme: string
  }
}

export function SettingsContent({ user, preferences }: SettingsContentProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState({
    email_notifications: preferences?.email_notifications || false,
    theme: preferences?.theme || 'system'
  })

  const supabase = createClientComponentClient()

  const handleSavePreferences = async () => {
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          email_notifications: settings.email_notifications,
          theme: settings.theme,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    )

    if (!confirmed) return

    setIsLoading(true)

    try {
      // Delete user data from related tables
      await Promise.all([
        supabase.from('user_preferences').delete().eq('user_id', user.id),
        supabase.from('product_votes').delete().eq('user_id', user.id),
        supabase.from('users').delete().eq('id', user.id)
      ])

      // Sign out and delete auth user
      await supabase.auth.signOut()
      
      toast.success('Account deleted successfully')
      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-8">
      <Tabs defaultValue="preferences" className="space-y-4">
        <TabsList>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Manage your notification and display preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email_notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications about your activity
                    </p>
                  </div>
                  <Switch
                    id="email_notifications"
                    checked={settings.email_notifications}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, email_notifications: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="flex space-x-2">
                    {['light', 'dark', 'system'].map((theme) => (
                      <Button
                        key={theme}
                        variant={settings.theme === theme ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSettings({ ...settings, theme })}
                      >
                        {theme.charAt(0).toUpperCase() + theme.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSavePreferences}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Manage your account settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Email Address</h4>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>

                <div>
                  <h4 className="font-medium">Account Created</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-red-600">Danger Zone</h4>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Delete Account'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 