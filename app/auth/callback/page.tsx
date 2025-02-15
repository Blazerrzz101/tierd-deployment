"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get the auth code from the URL
    const code = searchParams.get('code')
    const next = searchParams.get('next') || '/'

    if (code) {
      supabase.auth.exchangeCodeForSession(code)
        .then(({ data, error }) => {
          if (error) {
            console.error('Error exchanging code for session:', error)
            toast.error("Authentication failed. Please try again.")
            router.push('/auth/sign-in')
            return
          }

          // Create or update user profile
          if (data.session?.user) {
            supabase
              .from('user_profiles')
              .upsert({
                id: data.session.user.id,
                email: data.session.user.email,
                username: data.session.user.user_metadata.username || data.session.user.email?.split('@')[0],
                avatar_url: data.session.user.user_metadata.avatar_url,
                preferences: {
                  theme: "dark",
                  email_notifications: true,
                  accessibility_mode: false
                }
              })
              .then(({ error: profileError }) => {
                if (profileError) {
                  console.error('Error updating user profile:', profileError)
                }
              })
          }

          toast.success("Signed in successfully")
          router.push(next)
        })
    } else {
      toast.error("No authentication code found")
      router.push('/auth/sign-in')
    }
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">
          Completing sign in...
        </p>
      </div>
    </div>
  )
} 