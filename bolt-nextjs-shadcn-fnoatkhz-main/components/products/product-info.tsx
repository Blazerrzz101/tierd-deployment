"use client";

import { useState } from "react";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Share2, ShoppingCart, ThumbsDown, ThumbsUp } from "lucide-react";
import { useVote } from "@/hooks/use-vote";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProductInfoProps {
  product: Product;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const [quantity, setQuantity] = useState("1");
  const { product: currentProduct, vote } = useVote(product);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{currentProduct.name}</h1>
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
        <div className="mt-2 flex items-center gap-4">
          <Badge variant="secondary">Rank #{currentProduct.rank}</Badge>
          <span className="text-xl font-bold">
            ${currentProduct.price.toFixed(2)}
          </span>
        </div>
      </div>

      <p className="text-lg text-muted-foreground">
        {currentProduct.description}
      </p>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => vote("down")}
              className={cn(
                "hover:border-red-500 hover:text-red-500",
                currentProduct.userVote === "down" && "border-red-500 text-red-500"
              )}
            >
              <ThumbsDown className="mr-2 h-5 w-5" />
              Downvote
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => vote("up")}
              className={cn(
                "hover:border-green-500 hover:text-green-500",
                currentProduct.userVote === "up" && "border-green-500 text-green-500"
              )}
            >
              <ThumbsUp className="mr-2 h-5 w-5" />
              Upvote
            </Button>
          </div>
          <span className="text-lg font-medium">
            {currentProduct.votes} votes
          </span>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Select value={quantity} onValueChange={setQuantity}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Quantity" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="lg" className="flex-1 warm-gradient text-white hover:opacity-90">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Add to Cart
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          SKU: {currentProduct.id}
          <br />
          Stock Status: In Stock
        </div>
      </div>
    </div>
  );
}
