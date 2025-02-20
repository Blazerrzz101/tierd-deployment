import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { VoteType } from "@/types/product";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { useVote } from "@/hooks/use-vote";

interface VoteButtonsProps {
  product: {
    id: string;
    userVote: VoteType | null;
    upvotes: number;
    downvotes: number;
  };
  className?: string;
}

export function VoteButtons({ product, className }: VoteButtonsProps) {
  const { vote } = useVote();

  const handleVote = async (voteType: VoteType) => {
    await vote(product.id, voteType);
  };

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", {
          "text-green-500": product.userVote === "up",
        })}
        onClick={() => handleVote("up")}
      >
        <ArrowBigUp className="h-6 w-6" />
      </Button>
      <span className="text-sm font-medium">{product.upvotes}</span>
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", {
          "text-red-500": product.userVote === "down",
        })}
        onClick={() => handleVote("down")}
      >
        <ArrowBigDown className="h-6 w-6" />
      </Button>
      <span className="text-sm font-medium">{product.downvotes}</span>
    </div>
  );
} 