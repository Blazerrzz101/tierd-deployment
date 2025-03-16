"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code")
      const next = searchParams.get("next") ?? "/"

      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error

          toast.success("Successfully signed in!", {
            description: "Welcome back to Tier'd!"
          })

          router.push(next)
        } catch (error) {
          toast.error("Error signing in", {
            description: "There was a problem signing you in. Please try again."
          })
          router.push("/auth/sign-in")
        }
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-sm text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
} 