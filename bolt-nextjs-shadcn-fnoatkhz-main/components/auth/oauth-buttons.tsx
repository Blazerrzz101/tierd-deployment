"use client"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"

interface OAuthButtonsProps {
  isLoading?: boolean
}

export function OAuthButtons({ isLoading }: OAuthButtonsProps) {
  return (
    <>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid gap-2">
        <Button variant="outline" type="button" disabled={isLoading}>
          <Icons.google className="mr-2 h-4 w-4" />
          Google
        </Button>
        <Button variant="outline" type="button" disabled={isLoading}>
          <Icons.discord className="mr-2 h-4 w-4" />
          Discord
        </Button>
      </div>
    </>
  )
}