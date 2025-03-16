"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { mockPolls } from "@/lib/mock-polls"
import { Poll } from "@/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function CommunityPolls() {
  const [polls, setPolls] = useState(mockPolls)

  const handleVote = (pollId: string, optionId: string) => {
    setPolls(currentPolls =>
      currentPolls.map(poll => {
        if (poll.id === pollId) {
          // Check if user has already voted
          if (poll.userVote) {
            toast.error("You've already voted in this poll")
            return poll
          }

          // Update vote counts
          const updatedOptions = poll.options.map(option => ({
            ...option,
            votes: option.id === optionId ? option.votes + 1 : option.votes
          }))

          // Calculate total votes for percentages
          const totalVotes = updatedOptions.reduce((sum, option) => sum + option.votes, 0)

          return {
            ...poll,
            options: updatedOptions,
            totalVotes,
            userVote: optionId
          }
        }
        return poll
      })
    )
  }

  return (
    <div className="space-y-6">
      {polls.map((poll) => (
        <Card key={poll.id}>
          <CardHeader>
            <h3 className="text-lg font-semibold">{poll.question}</h3>
            <p className="text-sm text-muted-foreground">
              {poll.totalVotes} votes • {poll.daysLeft} days left
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {poll.options.map((option) => {
              const percentage = poll.totalVotes > 0
                ? Math.round((option.votes / poll.totalVotes) * 100)
                : 0

              return (
                <div key={option.id} className="space-y-2">
                  <Button
                    variant={poll.userVote === option.id ? "default" : "outline"}
                    className={cn(
                      "w-full justify-start",
                      poll.userVote && "cursor-default"
                    )}
                    onClick={() => handleVote(poll.id, option.id)}
                    disabled={Boolean(poll.userVote)}
                  >
                    {option.text}
                  </Button>
                  <div className="flex items-center gap-2">
                    <Progress value={percentage} className="h-2" />
                    <span className="min-w-[3ch] text-sm font-medium">
                      {percentage}%
                    </span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}