"use client"

import { useRouter } from "next/navigation"
import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function VerifyEmailPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center space-y-3 text-center">
        <div className="rounded-full bg-primary/10 p-3">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-muted-foreground">
          We've sent you a verification link. Please check your email to verify your account.
        </p>
      </div>
      <div className="flex flex-col space-y-4">
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