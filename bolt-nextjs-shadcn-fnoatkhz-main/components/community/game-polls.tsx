"use client"

import { CommunityPolls } from "./polls"

interface GamePollsProps {
  gameId: string
}

export function GamePolls({ gameId }: GamePollsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Community Polls</h3>
      <CommunityPolls />
    </div>
  )
}