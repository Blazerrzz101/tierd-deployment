"use client"

import React from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAuth } from "@/hooks/use-auth"

interface VoteLimiterTooltipProps {
  remainingCooldown: number
  canVote: boolean
  children: React.ReactNode
}

export default function VoteLimiterTooltip({ 
  remainingCooldown, 
  canVote, 
  children 
}: VoteLimiterTooltipProps) {
  const { user } = useAuth()

  if (user && canVote) {
    return <>{children}</>
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent>
          {!user 
            ? 'Please sign in to vote on products'
            : remainingCooldown > 0
              ? `Please wait ${Math.ceil(remainingCooldown / 1000)}s before voting again`
              : 'You cannot vote at this time'
          }
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}