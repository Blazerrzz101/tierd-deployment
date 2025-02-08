"use client";

import { Product } from "@/types/product";
import { VoteButtons } from "./vote-buttons";
import { useVote } from "@/hooks/use-vote";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface ProductInfoProps {
  product: Product;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const { product: currentProduct, vote } = useVote(product);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-white/90">
            {currentProduct.name}
          </h1>
          <Button variant="ghost" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="capitalize">
            {currentProduct.category}
          </Badge>
          <span className="text-2xl font-bold text-white/90">
            {formatPrice(currentProduct.price)}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-white/70">
          {currentProduct.description}
        </p>
        <VoteButtons product={currentProduct} />
      </div>
    </div>
  );
}
