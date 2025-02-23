"use client"

import { useState } from "react"
import { Star, ShoppingCart, Heart, Share2, MessageSquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Product, VoteType } from "@/types/product"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { useVote } from "@/hooks/use-vote"
import { ProductReviews } from "@/components/products/product-reviews"
import { ProductThreads } from "@/components/products/product-threads"
import { VoteButtons } from "@/components/products/vote-buttons"
import { ProductImage } from "@/components/ui/product-image"
import { RelatedProducts } from "@/components/products/related-products"
import { ProductComparison } from "@/components/products/product-comparison"
import { cn, formatTimeAgo } from "@/lib/utils"

interface ProductDetailsProps {
  product: Product
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const { addToCart } = useCart()
  const { addToWishlist, isInWishlist } = useWishlist()
  const { vote } = useVote()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("specifications")

  const handleAddToCart = () => {
    addToCart(product)
    toast({
      title: "Added to Cart",
      children: `${product.name} has been added to your cart.`
    })
  }

  const handleAddToWishlist = () => {
    addToWishlist(product)
    toast({
      title: "Added to Wishlist",
      children: `${product.name} has been added to your wishlist.`
    })
  }

  // Early return if no product data
  if (!product) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Product Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The product you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    )
  }

  const specifications = product.specifications ? Object.entries(product.specifications) : []

  // Aggregate pros and cons from reviews
  const allPros = product.reviews?.flatMap(review => review.pros || []) || []
  const allCons = product.reviews?.flatMap(review => review.cons || []) || []
  
  // Count occurrences of each pro/con
  const prosCount = allPros.reduce((acc, pro) => {
    acc[pro] = (acc[pro] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const consCount = allCons.reduce((acc, con) => {
    acc[con] = (acc[con] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // Sort by frequency
  const pros = Object.entries(prosCount)
    .sort(([,a], [,b]) => b - a)
    .map(([pro]) => pro)
  
  const cons = Object.entries(consCount)
    .sort(([,a], [,b]) => b - a)
    .map(([con]) => con)

  return (
    <div className="space-y-8">
      {/* Product Header */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden rounded-lg border border-white/10">
          <ProductImage
            src={product.image_url}
            alt={product.name}
            category={product.category}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>

        {/* Product Info */}
        <div className="flex flex-col space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <Badge variant="secondary" className="capitalize">
                {product.category?.replace(/-/g, ' ')}
              </Badge>
            </div>
            <p className="mt-2 text-lg text-muted-foreground">
              {product.description}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="ml-1 text-lg font-semibold">
                {product.rating?.toFixed(1) || "N/A"}
              </span>
              <span className="ml-1 text-sm text-muted-foreground">
                ({product.review_count || 0} reviews)
              </span>
            </div>
            <div className="text-2xl font-bold">
              ${product.price?.toFixed(2)}
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              size="lg"
              className="flex-1"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
            <Button
              size="lg"
              variant="outline"
              className={cn(
                "flex-1",
                isInWishlist(product.id) && "text-red-500"
              )}
              onClick={handleAddToWishlist}
            >
              <Heart className="mr-2 h-5 w-5" />
              {isInWishlist(product.id) ? "In Wishlist" : "Add to Wishlist"}
            </Button>
          </div>

          <VoteButtons
            product={{
              id: product.id,
              upvotes: product.upvotes,
              downvotes: product.downvotes,
              userVote: null
            }}
            onVote={vote}
          />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Key Features</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {specifications.slice(0, 4).map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-lg border border-white/10 bg-white/5 p-4"
                >
                  <div className="text-sm text-muted-foreground">{key}</div>
                  <div className="mt-1 font-medium">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="specifications" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="specifications">All Specifications</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
        </TabsList>

        <TabsContent value="specifications" className="space-y-8">
          <div className="mt-6">
            <h2 className="text-xl font-semibold">Technical Specifications</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {specifications.map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between rounded-lg border border-white/10 bg-white/5 p-4"
                >
                  <span className="text-muted-foreground">{key}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reviews">
          <ProductReviews 
            productId={product.id} 
            reviews={product.reviews?.map(review => ({
              id: review.id,
              rating: review.rating,
              content: review.content,
              title: review.title || '',
              created_at: review.created_at,
              user: {
                id: review.user.id,
                username: review.user.display_name,
                avatar_url: review.user.avatar_url
              }
            }))} 
          />
        </TabsContent>

        <TabsContent value="discussions">
          <ProductThreads 
            productId={product.id} 
            threads={product.threads?.map(thread => ({
              id: thread.id,
              title: thread.title,
              content: thread.content,
              created_at: thread.created_at,
              user: {
                id: thread.user.id,
                username: thread.user.display_name,
                avatar_url: thread.user.avatar_url
              }
            }))} 
          />
        </TabsContent>

        <TabsContent value="compare">
          <ProductComparison product={product} />
        </TabsContent>
      </Tabs>

      {/* Related Products */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Related Products</h2>
        <RelatedProducts product={product} limit={4} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-4 font-medium">✓ Pros</h3>
          <ul className="space-y-2">
            {pros.map((pro, index) => (
              <li key={index} className="text-sm text-muted-foreground">
                • {pro} <span className="text-xs">({prosCount[pro]})</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="mb-4 font-medium">✕ Cons</h3>
          <ul className="space-y-2">
            {cons.map((con, index) => (
              <li key={index} className="text-sm text-muted-foreground">
                • {con} <span className="text-xs">({consCount[con]})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h3 className="mb-4 font-medium">⚙ Specs</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {Object.entries(product.specifications || {}).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-muted-foreground">{key}</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}