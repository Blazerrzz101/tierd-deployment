"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Star, ShoppingCart, Heart } from "lucide-react"
import { cn, normalizeProduct } from "@/lib/utils"
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
import { ProductImage } from "@/components/ui/product-image"

interface ProductCardProps {
  product: any
  className?: string
  variant?: "default" | "compact"
}

export function ProductCard({ product: rawProduct, className, variant }: ProductCardProps) {
  const { addToCart } = useCart()
  const { addToWishlist, isInWishlist } = useWishlist()
  const { toast } = useToast()
  const product = normalizeProduct(rawProduct) as Required<Product>
  const isCompact = variant === "compact"

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
        <div className={cn(
          "relative overflow-hidden rounded-lg",
          isCompact ? "aspect-[4/3]" : "aspect-square"
        )}>
          <ProductImage
            src={product.image_url || product.imageUrl}
            alt={product.name}
            category={product.category}
            fill
            sizes={isCompact 
              ? "(max-width: 768px) 50vw, 33vw"
              : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            }
            className="transition-transform duration-300 group-hover:scale-110"
          />
          
          {/* Quick Actions */}
          {product.url_slug && !isCompact && (
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
        </div>

        {/* Product Info */}
        <div className={cn(
          "mt-4",
          isCompact ? "space-y-1" : "space-y-2"
        )}>
          <div className="flex items-center justify-between">
            <h3 className={cn(
              "font-medium text-white/90 line-clamp-1",
              isCompact ? "text-sm" : "text-base"
            )}>
              {product.name}
            </h3>
            {!isCompact && (
              <Badge variant="secondary" className="capitalize">
                {product.category}
              </Badge>
            )}
          </div>
          <div className={cn(
            "flex items-center",
            isCompact ? "justify-between" : "gap-4"
          )}>
            <span className={cn(
              "font-bold text-white/90",
              isCompact ? "text-base" : "text-lg"
            )}>
              ${product.price}
            </span>
            {!isCompact && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => addToCart(product)}
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  )
} 