import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowBigUp, ArrowBigDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface VoteButtonProps {
  type: "up" | "down"
  count: number
  isVoted: boolean
  onVote: (type: "up" | "down") => Promise<void>
  className?: string
}

export function VoteButton({
  type,
  count,
  isVoted,
  onVote,
  className,
}: VoteButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleVote = async () => {
    try {
      setIsLoading(true)
      await onVote(type)
      
      // Only show toast when voting, not when removing vote
      if (!isVoted) {
        toast.success(
          type === "up" 
            ? "Thanks for the upvote!" 
            : "Thanks for the feedback!"
        )
      }
    } catch (error) {
      toast.error("Failed to register vote. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const Icon = type === "up" ? ArrowBigUp : ArrowBigDown
  
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "flex items-center space-x-1 hover:bg-muted",
        isVoted && "text-primary",
        isLoading && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleVote}
      disabled={isLoading}
    >
      <Icon className={cn(
        "h-5 w-5 transition-transform",
        isVoted && type === "up" && "animate-bounce",
        isVoted && type === "down" && "animate-bounce"
      )} />
      <span className="text-sm font-medium">{count}</span>
    </Button>
  )
} 