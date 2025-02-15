"use client";

import { Product } from "@/types/product";
import { VoteButtons } from "./vote-buttons";
import { useVote } from "@/hooks/use-vote";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Image from "next/image";

interface ProductInfoProps {
  product?: Product;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const { product: currentProduct, isLoading, vote } = useVote(product);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
        <Image 
          src="/images/products/placeholder.svg"
          alt="Product Not Found"
          width={200}
          height={200}
          className="rounded-lg"
        />
        <h2 className="text-xl font-semibold">Product Not Found</h2>
        <p className="text-muted-foreground">
          The product you're looking for doesn't exist or has been removed.
        </p>
      </div>
    );
  }

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
        <div className="relative w-full aspect-video rounded-lg overflow-hidden">
          <Image
            src={currentProduct.image_url || "/images/products/placeholder.svg"}
            alt={currentProduct.name}
            fill
            className="object-cover"
          />
        </div>
        <p className="text-sm leading-relaxed text-white/70">
          {currentProduct.description}
        </p>
        <VoteButtons product={currentProduct} onVote={vote} />
      </div>
    </div>
  );
}
