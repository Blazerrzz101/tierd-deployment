"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase/client"

export default function ProfilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      toast.success("Signed out successfully")
      router.push("/auth/sign-in")
    } catch (error) {
      toast.error("Error signing out", {
        description: "There was a problem signing you out. Please try again."
      })
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      if (!user) {
        throw new Error("User not found")
      }

      const updates = {
        username: username || undefined,
        email: email || undefined,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id)

      if (error) throw error

      toast.success("Profile updated successfully")
    } catch (error) {
      toast.error("Error updating profile", {
        description: "There was a problem updating your profile. Please try again."
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl space-y-8 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      <Separator />
      <form onSubmit={handleUpdateProfile} className="space-y-8">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button type="submit" disabled={isLoading}>
            Update Profile
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSignOut}
            disabled={isLoading}
          >
            Sign Out
          </Button>
        </div>
      </form>
    </div>
  )
}
