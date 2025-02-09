"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Star, ShoppingCart, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { Product } from "@/hooks/use-product"
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
      description: `${product.name} has been added to your cart.`
    })
  }

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    addToWishlist(product)
    toast({
      title: "Added to Wishlist",
      description: `${product.name} has been added to your wishlist.`
    })
  }

  return (
    <Link href={`/products/${product.url_slug}`}>
      <motion.div
        className={cn(
          "group relative overflow-hidden rounded-lg bg-black/5 p-4",
          "hover:bg-black/10 transition-colors duration-300",
          className
        )}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
      >
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Quick Actions */}
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

          {/* Stock Status */}
          {product.stock_status !== "in_stock" && (
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
            {product.name}
          </h3>

          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              ({product.review_count})
            </span>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-lg font-bold">
              ${product.price.toFixed(2)}
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  )
} 