"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search } from "@/components/search"
import { games } from "@/lib/mock-games"
import { Users, MessageSquare, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface GameListProps {
  onSelectGame: (gameId: string) => void
}

export function GameList({ onSelectGame }: GameListProps) {
  return (
    <div className="space-y-6">
      <Search
        onSearch={() => {}}
        className="w-full"
        placeholder="Search games..."
      />

      <div className="grid gap-6 sm:grid-cols-2">
        {games.map((game) => (
          <Card
            key={game.id}
            className="group relative cursor-pointer overflow-hidden border-2 transition-all hover:border-primary hover:shadow-lg"
            onClick={() => onSelectGame(game.id)}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-background/20" />
            
            <CardContent className="relative space-y-4 p-6">
              {/* Game Title and Stats */}
              <div>
                <h3 className="text-2xl font-bold tracking-tight">{game.name}</h3>
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {game.activeUsers} active
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {game.threadCount} discussions
                  </div>
                </div>
              </div>

              {/* Game Description */}
              <p className="text-sm text-muted-foreground">{game.description}</p>

              {/* Trending Indicator */}
              {Math.random() > 0.5 && (
                <div className={cn(
                  "absolute right-4 top-4 flex items-center gap-1 rounded-full",
                  "bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                )}>
                  <TrendingUp className="h-3 w-3" />
                  Trending
                </div>
              )}

              {/* Join Button */}
              <Button
                className="w-full transition-transform group-hover:translate-y-0 group-hover:opacity-100 sm:absolute sm:bottom-4 sm:right-4 sm:w-auto sm:translate-y-2 sm:opacity-0"
                size="sm"
              >
                Join Discussion
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}