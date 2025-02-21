"use client"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

interface OAuthButtonsProps {
  className?: string
}

export function OAuthButtons({ className }: OAuthButtonsProps) {
  const { signInWithProvider } = useAuth()
  
  return (
    <div className={cn("grid gap-2", className)}>
      <Button
        variant="outline"
        onClick={() => signInWithProvider("github")}
        className="bg-white/5 hover:bg-white/10"
      >
        <Icons.gitHub className="mr-2 h-4 w-4" />
        Continue with GitHub
      </Button>
      <Button
        variant="outline"
        onClick={() => signInWithProvider("google")}
        className="bg-white/5 hover:bg-white/10"
      >
        <Icons.google className="mr-2 h-4 w-4" />
        Continue with Google
      </Button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
    </div>
  )
}