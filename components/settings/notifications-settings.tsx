"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "sonner"

export function NotificationsSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    productUpdates: true,
    communityActivity: true,
    mentions: true
  })

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSave = () => {
    // TODO: Implement save to backend
    toast.success("Notification settings updated!")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {Object.entries(settings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={key} className="flex-1">
                {key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())}
              </Label>
              <Switch
                id={key}
                checked={value}
                onCheckedChange={() => handleToggle(key as keyof typeof settings)}
              />
            </div>
          ))}
        </div>

        <Button onClick={handleSave} className="w-full">Save Changes</Button>
      </CardContent>
    </Card>
  )
}