import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { VoteType } from "@/types/product";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { useVote } from "@/hooks/use-vote";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";

interface VoteButtonsProps {
  product: {
    id: string;
    name: string;
    userVote: VoteType | null;
    upvotes: number;
    downvotes: number;
  };
  className?: string;
}

export function VoteButtons({ product, className }: VoteButtonsProps) {
  const { vote, isLoading, isAuthenticated } = useVote();
  const [localVote, setLocalVote] = useState<VoteType | null>(product.userVote);
  const [localUpvotes, setLocalUpvotes] = useState(product.upvotes);
  const [localDownvotes, setLocalDownvotes] = useState(product.downvotes);

  const handleVote = async (voteType: VoteType) => {
    if (isLoading) return;

    // Store previous state for rollback
    const previousVote = localVote;
    const previousUpvotes = localUpvotes;
    const previousDownvotes = localDownvotes;

    // Optimistically update UI
    if (localVote === voteType) {
      // Removing vote
      setLocalVote(null);
      if (voteType === 1) {
        setLocalUpvotes(prev => prev - 1);
      } else {
        setLocalDownvotes(prev => prev - 1);
      }
    } else {
      // Adding or changing vote
      if (localVote === null) {
        // Adding new vote
        if (voteType === 1) {
          setLocalUpvotes(prev => prev + 1);
        } else {
          setLocalDownvotes(prev => prev + 1);
        }
      } else {
        // Changing vote
        if (voteType === 1) {
          setLocalUpvotes(prev => prev + 1);
          setLocalDownvotes(prev => prev - 1);
        } else {
          setLocalUpvotes(prev => prev - 1);
          setLocalDownvotes(prev => prev + 1);
        }
      }
      setLocalVote(voteType);
    }

    try {
      const result = await vote({
        id: product.id,
        name: product.name,
        upvotes: product.upvotes,
        downvotes: product.downvotes,
        userVote: product.userVote
      }, voteType);
      
      // If the vote was successful but returned a different state than expected,
      // update the local state to match
      if (result !== undefined) {
        setLocalVote(result);
        // Refresh the page to get the latest vote counts
        window.location.reload();
      }
    } catch (error) {
      // Rollback on error
      setLocalVote(previousVote);
      setLocalUpvotes(previousUpvotes);
      setLocalDownvotes(previousDownvotes);
    }
  };

  const renderVoteButton = (type: VoteType, Icon: typeof ArrowBigUp | typeof ArrowBigDown) => {
    const isUpvote = type === 1;
    const count = isUpvote ? localUpvotes : localDownvotes;
    const isActive = localVote === type;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-full",
                isActive && (isUpvote ? "text-green-500" : "text-red-500"),
                !isAuthenticated && "hover:cursor-pointer"
              )}
              onClick={() => handleVote(type)}
              disabled={isLoading}
            >
              <Icon className={cn(
                "h-6 w-6",
                isActive && (isUpvote ? "fill-green-500" : "fill-red-500")
              )} />
              <span className="sr-only">
                {isUpvote ? "Upvote" : "Downvote"}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isAuthenticated
              ? `Click to ${isActive ? "remove" : ""} ${isUpvote ? "upvote" : "downvote"}`
              : "Sign in to vote"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {renderVoteButton(1, ArrowBigUp)}
      <span className="min-w-[2ch] text-center tabular-nums">
        {localUpvotes - localDownvotes}
      </span>
      {renderVoteButton(-1, ArrowBigDown)}
    </div>
  );
} 