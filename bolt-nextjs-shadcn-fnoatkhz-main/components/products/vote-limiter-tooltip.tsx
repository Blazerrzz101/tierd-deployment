```tsx
"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AlertCircle } from "lucide-react"

interface VoteLimiterTooltipProps {
  children: React.ReactNode
  remainingCooldown: number
  canVote: boolean
}

export function VoteLimiterTooltip({ children, remainingCooldown, canVote }: VoteLimiterTooltipProps) {
  if (canVote) {
    return <>{children}</>
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-not-allowed opacity-50">
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <p>
            {remainingCooldown > 0
              ? `Please wait ${Math.ceil(remainingCooldown / 1000)}s before voting again`
              : "You've reached the voting limit. Try again later."}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
```