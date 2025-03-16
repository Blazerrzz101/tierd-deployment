"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { games } from "@/lib/mock-games"
import { TrendingUp } from "lucide-react"

interface TrendingGamesProps {
  onSelectGame: (gameId: string) => void
}

export function TrendingGames({ onSelectGame }: TrendingGamesProps) {
  // Get top 3 games by active users
  const trendingGames = [...games]
    .sort((a, b) => parseInt(b.activeUsers) - parseInt(a.activeUsers))
    .slice(0, 3)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Trending Games
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {trendingGames.map((game) => (
            <Button
              key={game.id}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => onSelectGame(game.id)}
            >
              <div className="flex flex-1 items-center justify-between">
                <span>{game.name}</span>
                <span className="text-sm text-muted-foreground">
                  {game.activeUsers} active
                </span>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}