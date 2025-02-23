"use client";

import { Product } from "@/types/product";
import { VoteButtons } from "./vote-buttons";
import { useVote } from "@/hooks/use-vote";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Share2, ShoppingCart, Heart, Star } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ProductImage } from "@/components/ui/product-image";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface ProductInfoProps {
  product?: Product;
}

export function ProductInfo({ product }: ProductInfoProps) {
  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
        <div className="relative w-[200px] h-[200px]">
          <ProductImage
            src={null}
            alt="Product Not Found"
            category="default"
            width={200}
            height={200}
            className="rounded-lg"
          />
        </div>
        <h2 className="text-xl font-semibold">Product Not Found</h2>
        <p className="text-muted-foreground">
          The product you're looking for doesn't exist or has been removed.
        </p>
      </div>
    );
  }

  const handleAddToCart = () => {
    toast.success("Added to cart", {
      description: `${product.name} has been added to your cart.`
    });
  };

  const handleAddToWishlist = () => {
    toast.success("Added to wishlist", {
      description: `${product.name} has been added to your wishlist.`
    });
  };

  return (
    <Card className="p-6 space-y-6 relative">
      <VoteButtons
        product={{
          id: product.id,
          name: product.name,
          upvotes: product.upvotes || 0,
          downvotes: product.downvotes || 0,
          userVote: product.userVote || null
        }}
        className="absolute right-6 top-6"
      />
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            {product.name}
          </h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleAddToWishlist}>
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="capitalize">
            {product.category.replace(/-/g, ' ')}
          </Badge>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span className="font-medium">{product.rating?.toFixed(1) || 'N/A'}</span>
            <span className="text-sm text-muted-foreground">
              ({product.review_count || 0} reviews)
            </span>
          </div>
        </div>

        <div className="text-3xl font-bold">
          {formatPrice(product.price)}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {Object.entries(product.specifications || {}).map(([key, value]) => {
            if (key === 'features' && Array.isArray(value)) {
              return (
                <div key={key} className="col-span-2 space-y-2">
                  <span className="font-medium capitalize">Key Features</span>
                  <div className="grid grid-cols-2 gap-2">
                    {value.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <div key={key} className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="text-muted-foreground">{value}</span>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex gap-2">
          <Button className="flex-1" size="lg" onClick={handleAddToCart}>
            <ShoppingCart className="mr-2 h-5 w-5" />
            Add to Cart
          </Button>
          <Button variant="outline" size="lg" onClick={handleAddToWishlist}>
            <Heart className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
