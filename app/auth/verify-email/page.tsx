"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Mail, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const [isResending, setIsResending] = useState(false)
  const supabase = createClientComponentClient()

  // Function to resend verification email
  async function resendVerification() {
    if (!email) {
      toast.error("No email address provided", {
        description: "Please try signing up again with your email."
      })
      return
    }

    setIsResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`
        }
      })

      if (error) {
        throw error
      }

      toast.success("Verification email resent", {
        description: "Please check your inbox and spam folder."
      })
    } catch (error) {
      console.error("Error resending verification email:", error)
      toast.error("Failed to resend verification email", {
        description: "Please try signing up again."
      })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center space-y-3 text-center">
        <div className="rounded-full bg-primary/10 p-3">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Check your email</h1>
        {email ? (
          <p className="text-muted-foreground">
            We've sent a verification link to <span className="font-medium">{email}</span>.
            <br />Please check your inbox and spam folder to verify your account.
          </p>
        ) : (
          <p className="text-muted-foreground">
            We've sent you a verification link. Please check your email to verify your account.
          </p>
        )}
      </div>
      <div className="flex flex-col space-y-4">
        {email && (
          <Button
            variant="default"
            onClick={resendVerification}
            disabled={isResending}
          >
            {isResending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend Verification Email
              </>
            )}
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => router.push("/auth/sign-in")}
        >
          Return to Sign In
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Didn't receive the email?{" "}
          <Button
            variant="link"
            className="underline"
            onClick={() => router.push("/auth/sign-up")}
          >
            Try signing up again
          </Button>
        </p>
      </div>
    </div>
  )
} 