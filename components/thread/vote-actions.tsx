import { VoteButton } from "@/components/thread/vote-button"

interface VoteActionsProps {
  threadId: string
  upvotes: number
  downvotes: number
  userVote?: "up" | "down" | null
  onVote: (type: "up" | "down") => Promise<void>
  className?: string
}

export function VoteActions({
  threadId,
  upvotes,
  downvotes,
  userVote,
  onVote,
  className,
}: VoteActionsProps) {
  return (
    <div className={className}>
      <div className="flex items-center space-x-1">
        <VoteButton
          type="up"
          count={upvotes}
          isVoted={userVote === "up"}
          onVote={onVote}
        />
        <VoteButton
          type="down"
          count={downvotes}
          isVoted={userVote === "down"}
          onVote={onVote}
        />
      </div>
    </div>
  )
} 