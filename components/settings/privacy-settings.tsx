"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { UserProfile } from "@/types/user"
import { useState } from "react"
import { toast } from "sonner"

interface PrivacySettingsProps {
  user: UserProfile
}

export function PrivacySettings({ user }: PrivacySettingsProps) {
  const [settings, setSettings] = useState({
    isPublic: user.isPublic,
    showActivity: true,
    showPreferences: true
  })

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSave = () => {
    // TODO: Implement save to backend
    toast.success("Privacy settings updated!")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="isPublic" className="flex-1">
              Public Profile
              <p className="text-sm text-muted-foreground">
                Allow others to view your profile
              </p>
            </Label>
            <Switch
              id="isPublic"
              checked={settings.isPublic}
              onCheckedChange={() => handleToggle("isPublic")}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="showActivity" className="flex-1">
              Activity Visibility
              <p className="text-sm text-muted-foreground">
                Show your activity in the community feed
              </p>
            </Label>
            <Switch
              id="showActivity"
              checked={settings.showActivity}
              onCheckedChange={() => handleToggle("showActivity")}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="showPreferences" className="flex-1">
              Preferences Visibility
              <p className="text-sm text-muted-foreground">
                Show your preferred accessories
              </p>
            </Label>
            <Switch
              id="showPreferences"
              checked={settings.showPreferences}
              onCheckedChange={() => handleToggle("showPreferences")}
            />
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">Save Changes</Button>
      </CardContent>
    </Card>
  )
}