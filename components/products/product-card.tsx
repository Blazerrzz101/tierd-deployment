"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Star, ShoppingCart, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { Product } from "@/types/product"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addToCart } = useCart()
  const { addToWishlist, isInWishlist } = useWishlist()
  const { toast } = useToast()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addToCart(product)
    toast({
      title: "Added to Cart",
      variant: "default",
      children: `${product.name} has been added to your cart.`
    })
  }

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    addToWishlist(product)
    toast({
      title: "Added to Wishlist",
      variant: "default",
      children: `${product.name} has been added to your wishlist.`
    })
  }

  return (
    <Link 
      href={`/products/${product.url_slug || product.id}`} 
      className="block"
      onClick={(e) => {
        // Prevent navigation if product doesn't exist
        if (!product.url_slug && !product.id) {
          e.preventDefault()
          toast({
            title: "Product Unavailable",
            variant: "destructive",
            children: "This product is currently unavailable."
          })
        }
      }}
    >
      <motion.div
        className={cn(
          "group relative overflow-hidden rounded-lg bg-black/5 p-4",
          "hover:bg-black/10 transition-colors duration-300",
          className,
          (!product.url_slug && !product.id) && "opacity-50 cursor-not-allowed"
        )}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
      >
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
          <Image
            src={product.image_url || "/images/products/placeholder.svg"}
            alt={product.name || "Product Image"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={cn(
              "object-cover transition-transform duration-300",
              product.url_slug && "group-hover:scale-110"
            )}
            onError={(e) => {
              const img = e.target as HTMLImageElement
              img.src = "/images/products/placeholder.svg"
            }}
          />
          
          {/* Quick Actions */}
          {product.url_slug && (
            <div className="absolute right-2 top-2 flex flex-col gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add to Cart</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    className={cn(
                      "h-8 w-8",
                      isInWishlist(product.id) && "text-red-500"
                    )}
                    onClick={handleAddToWishlist}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add to Wishlist</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Product Status */}
          {!product.url_slug && (
            <Badge
              variant="destructive"
              className="absolute left-2 top-2"
            >
              Unavailable
            </Badge>
          )}
          {product.url_slug && product.stock_status !== "in_stock" && (
            <Badge
              variant={product.stock_status === "low_stock" ? "warning" : "destructive"}
              className="absolute left-2 top-2"
            >
              {product.stock_status === "low_stock" ? "Low Stock" : "Out of Stock"}
            </Badge>
          )}
        </div>

        {/* Product Info */}
        <div className="mt-4 space-y-2">
          <h3 className="line-clamp-2 text-lg font-semibold">
            {product.name || "Unnamed Product"}
          </h3>

          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating || 0)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              ({product.review_count || 0})
            </span>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-lg font-bold">
              ${(product.price || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  )
} 