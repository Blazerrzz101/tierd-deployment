"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, ShoppingCart, Heart, Share2, MessageSquarePlus, ChevronLeft, ChevronRight, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Product } from "@/types/product"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { useVote } from "@/hooks/use-vote"
import { ProductReviews } from "@/components/products/product-reviews"
import { ProductThreads } from "@/components/products/product-threads"
import { VoteButtons } from "@/components/products/vote-buttons"
import { useRouter } from "next/navigation"
import { cn, normalizeProduct } from "@/lib/utils"
import { ProductImage } from "@/components/ui/product-image"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { RelatedProducts } from "@/components/products/related-products"

interface ProductDetailsProps {
  product: Product
}

export function ProductDetails({ product: initialProduct }: ProductDetailsProps) {
  const { addToCart } = useCart()
  const { addToWishlist, isInWishlist } = useWishlist()
  const { toast } = useToast()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isRotating, setIsRotating] = useState(false)
  const router = useRouter()

  // Fetch the latest product data
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", initialProduct.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", initialProduct.id)
        .single()

      if (error) throw error
      return normalizeProduct(data) as Required<Product>
    },
    initialData: initialProduct as Required<Product>,
  })

  // Fetch related products
  const { data: relatedProducts = [] } = useQuery({
    queryKey: ["related-products", product.category, product.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category", product.category)
        .neq("id", product.id)
        .limit(4)

      if (error) throw error
      return data.map(p => normalizeProduct(p)) as Product[]
    },
  })

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

  const toggleRotation = () => {
    setIsRotating(!isRotating)
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % product.images?.length || 0)
  }

  const previousImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? (product.images?.length || 1) - 1 : prev - 1
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden rounded-lg bg-white/5">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            category={product.category}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className={cn(
              "object-cover transition-transform duration-500",
              isRotating && "animate-rotate-y"
            )}
          />
          <Button
            size="icon"
            variant="secondary"
            className="absolute right-4 top-4"
            onClick={toggleRotation}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <Badge variant="secondary" className="capitalize">
                {product.category}
              </Badge>
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
          </div>

          <p className="text-muted-foreground">
            {product.description}
          </p>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Specifications</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(product.specs || {}).map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-lg border border-white/10 bg-white/5 p-4"
                >
                  <div className="text-sm text-muted-foreground">
                    {key}
                  </div>
                  <div className="mt-1 font-medium">
                    {value}
                  </div>
                </div>
              ))}
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
        </div>
      </div>
      
      {/* Related Products */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Related Products</h2>
        <RelatedProducts product={product} limit={4} />
      </div>
    </div>
  )
}