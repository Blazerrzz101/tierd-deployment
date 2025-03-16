"use client"

import { useVoteTracking } from "@/hooks/use-vote-tracking"
import { Card } from "@/components/ui/card"
import { Users } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface VoteStatsProps {
  productId: string
}

export function VoteStats({ productId }: VoteStatsProps) {
  const { stats, activeUsers, isLoading, error } = useVoteTracking(productId)

  const votePercentage = stats.totalVotes > 0
    ? Math.round((stats.upvotes / stats.totalVotes) * 100)
    : 0

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>
          Failed to load vote statistics. Please try again later.
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
            <Skeleton className="h-2 w-full mt-2" />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Vote Statistics</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {activeUsers} active users
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Votes</span>
            <span className="font-medium">{stats.totalVotes}</span>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Upvotes</span>
              <span className="font-medium text-green-500">{stats.upvotes}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Downvotes</span>
              <span className="font-medium text-red-500">{stats.downvotes}</span>
            </div>
          </div>

          <div className="mt-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Approval Rating</span>
              <span className="font-medium">{votePercentage}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${votePercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}