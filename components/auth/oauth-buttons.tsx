"use client"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { useAuth } from "@/hooks/use-auth"

interface OAuthButtonsProps {
  className?: string
}

export function OAuthButtons({ className }: OAuthButtonsProps) {
  const { signInWithProvider } = useAuth()
  
  return (
    <div className={className}>
      <div className="grid gap-2">
        <Button
          variant="outline"
          onClick={() => signInWithProvider("github")}
          className="bg-white/5"
        >
          <Icons.gitHub className="mr-2 h-4 w-4" />
          Continue with GitHub
        </Button>
        <Button
          variant="outline"
          onClick={() => signInWithProvider("google")}
          className="bg-white/5"
        >
          <Icons.google className="mr-2 h-4 w-4" />
          Continue with Google
        </Button>
      </div>
    </div>
  )
}