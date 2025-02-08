import { VoteButton } from "@/components/thread/vote-button"

interface VoteActionsProps {
  threadId: string
  upvotes: number
  downvotes: number
  userVote?: "upvote" | "downvote" | null
  onVote: (type: "upvote" | "downvote") => Promise<void>
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
          type="upvote"
          count={upvotes}
          isVoted={userVote === "upvote"}
          onVote={onVote}
        />
        <VoteButton
          type="downvote"
          count={downvotes}
          isVoted={userVote === "downvote"}
          onVote={onVote}
        />
      </div>
    </div>
  )
} 