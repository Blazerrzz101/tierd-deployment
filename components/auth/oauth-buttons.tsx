"use client"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"

interface OAuthButtonsProps {
  isLoading?: boolean
}

export function OAuthButtons({ isLoading }: OAuthButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Button variant="outline" disabled={isLoading} className="w-full" onClick={() => {}}>
        {isLoading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.google className="mr-2 h-4 w-4" />
        )}
        Google
      </Button>
      <Button variant="outline" disabled={isLoading} className="w-full" onClick={() => {}}>
        {isLoading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.discord className="mr-2 h-4 w-4" />
        )}
        Discord
      </Button>
    </div>
  )
}