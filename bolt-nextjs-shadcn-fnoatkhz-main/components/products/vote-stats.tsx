"use client"

import { useVoteTracking } from "@/hooks/use-vote-tracking"
import { Card } from "@/components/ui/card"
import { Users } from "lucide-react"

interface VoteStatsProps {
  productId: string
}

export function VoteStats({ productId }: VoteStatsProps) {
  const { stats, activeUsers } = useVoteTracking(productId)

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Vote Statistics</h3>
          <div className="mt-1 text-sm text-muted-foreground">
            Total Votes: {stats.totalVotes}
            <br />
            Upvotes: {stats.upvotes}
            <br />
            Downvotes: {stats.downvotes}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {activeUsers} active users
        </div>
      </div>
    </Card>
  )
}