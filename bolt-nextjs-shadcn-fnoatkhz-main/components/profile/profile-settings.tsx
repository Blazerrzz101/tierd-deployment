"use client"

import { useState } from "react"
import { UserProfile } from "@/types/user"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface ProfileSettingsProps {
  user: UserProfile
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const [email, setEmail] = useState(user.email)
  const [notifications, setNotifications] = useState(true)
  const [publicProfile, setPublicProfile] = useState(user.isPublic)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingChange, setPendingChange] = useState<{ type: string; value: boolean } | null>(null)

  const handlePrivacyChange = (value: boolean) => {
    setPendingChange({ type: 'privacy', value })
    setShowConfirmDialog(true)
  }

  const handleConfirmChange = () => {
    if (!pendingChange) return

    if (pendingChange.type === 'privacy') {
      setPublicProfile(pendingChange.value)
      toast.success(`Profile visibility changed to ${pendingChange.value ? 'public' : 'private'}`)
    }

    setShowConfirmDialog(false)
    setPendingChange(null)
  }

  const handleSave = () => {
    // TODO: Implement settings update
    toast.success("Settings saved successfully!")
  }

  return (
    <>
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl">Profile Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-semibold">
              Username
            </Label>
            <Input 
              id="username" 
              value={user.username} 
              disabled 
              className="bg-muted/50 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold">
              Email
            </Label>
            <Input 
              id="email" 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold">Public Profile</Label>
              <div className="text-xs text-muted-foreground">
                Make your profile visible to everyone
              </div>
            </div>
            <Switch
              checked={publicProfile}
              onCheckedChange={handlePrivacyChange}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold">Email Notifications</Label>
              <div className="text-xs text-muted-foreground">
                Receive updates about your activity
              </div>
            </div>
            <Switch
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>

          <Button 
            onClick={handleSave} 
            className="w-full bg-primary font-medium hover:bg-primary/90"
          >
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Profile Visibility</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingChange?.value 
                ? "Making your profile public will allow anyone to see your activity and preferences."
                : "Making your profile private will hide your activity and preferences from other users."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmChange}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}