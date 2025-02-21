"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { supabase } from "@/lib/supabase"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) throw error

        if (!user) {
          throw new Error("User not found")
        }

        // Check if user profile exists
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError && profileError.code !== "PGRST116") {
          throw profileError
        }

        // Create profile if it doesn't exist
        if (!profile) {
          const { error: insertError } = await supabase.from("users").insert([
            {
              id: user.id,
              username: user.user_metadata.username || user.email?.split("@")[0],
              email: user.email,
              avatar_url: user.user_metadata.avatar_url,
            },
          ])

          if (insertError) throw insertError
        }

        router.push("/")
      } catch (error) {
        console.error("Error in auth callback:", error)
        router.push("/auth/sign-in")
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg font-medium">Setting up your account...</p>
      </div>
    </div>
  )
} 