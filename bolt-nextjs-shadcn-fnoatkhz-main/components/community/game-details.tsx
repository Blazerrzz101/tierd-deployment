"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { games } from "@/lib/mock-games"
import { GameRankings } from "./game-rankings"
import { GameDiscussions } from "./game-discussions"

interface GameDetailsProps {
  gameId: string
  onBack: () => void
}

export function GameDetails({ gameId, onBack }: GameDetailsProps) {
  const game = games.find((g) => g.id === gameId)
  if (!game) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{game.name}</h2>
          <p className="text-sm text-muted-foreground">{game.description}</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Rankings Section */}
        <section>
          <h3 className="mb-6 text-xl font-semibold">Community Rankings</h3>
          <GameRankings gameId={gameId} />
        </section>

        {/* Discussions Section */}
        <section>
          <h3 className="mb-6 text-xl font-semibold">Discussions</h3>
          <GameDiscussions gameId={gameId} />
        </section>
      </div>
    </div>
  )
}