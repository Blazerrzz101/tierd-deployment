"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, ShoppingCart, Heart, Share2, MessageSquarePlus, ChevronLeft, ChevronRight } from "lucide-react"
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

interface ProductDetailsProps {
  product: any
}

export function ProductDetails({ product: rawProduct }: ProductDetailsProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [isRotating, setIsRotating] = useState(false)
  const { toast } = useToast()
  const { addToCart } = useCart()
  const { addToWishlist } = useWishlist()
  const { vote } = useVote()
  const router = useRouter()
  const product = normalizeProduct(rawProduct) as Required<Product>

  if (!product) {
    return null;
  }

  // Get the base image URL and any additional images from specs
  const baseImageUrl = product.imageUrl
  const additionalImages = product.specs?.additional_images as string[] || []
  
  // Create array of image URLs
  const images = [baseImageUrl, ...additionalImages].filter(Boolean)

  const handleAddToCart = () => {
    addToCart(product)
    toast({
      title: "Added to cart",
      variant: "default",
      children: `${product.name} has been added to your cart.`,
    })
  }

  const handleAddToWishlist = () => {
    addToWishlist(product)
    toast({
      title: "Added to wishlist",
      variant: "default",
      children: `${product.name} has been added to your wishlist.`,
    })
  }

  const toggleRotation = () => {
    setIsRotating(!isRotating)
  }

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length)
  }

  const previousImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Product Images */}
      <div className="space-y-4">
        <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-100">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedImage}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                rotate: isRotating ? 360 : 0
              }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ 
                duration: isRotating ? 10 : 0.3,
                repeat: isRotating ? Infinity : 0,
                ease: isRotating ? "linear" : "easeInOut"
              }}
            >
              <ProductImage
                src={images[selectedImage]}
                alt={`${product.name} - View ${selectedImage + 1}`}
                category={product.category}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                className="object-contain"
              />
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90"
                onClick={previousImage}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90"
                onClick={nextImage}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* 3D Rotation Toggle */}
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "absolute bottom-4 right-4 bg-white/80 hover:bg-white/90",
              isRotating && "bg-blue-100 hover:bg-blue-200"
            )}
            onClick={toggleRotation}
          >
            {isRotating ? "Stop 3D" : "View 3D"}
          </Button>
        </div>
        
        {/* Thumbnail Gallery */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {images.map((image, index) => (
              <button
                key={index}
                className={`relative aspect-square rounded-md overflow-hidden 
                           ${selectedImage === index ? 'ring-2 ring-[#ff4b26]' : ''}`}
                onClick={() => setSelectedImage(index)}
              >
                <ProductImage
                  src={image}
                  alt={`${product.name} - Thumbnail ${index + 1}`}
                  category={product.category}
                  fill
                  sizes="25vw"
                  showPlaceholderIcon={false}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-white/90">
              {product.name}
            </h1>
            <Button variant="ghost" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="capitalize">
              {product.category}
            </Badge>
            <span className="text-2xl font-bold text-white/90">
              ${product.price}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-white/70">
            {product.description}
          </p>
          <VoteButtons product={product} onVote={vote} />
        </div>

        <div className="flex gap-4">
          <Button className="flex-1" onClick={handleAddToCart}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
          <Button variant="outline" size="icon" onClick={handleAddToWishlist}>
            <Heart className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="specs">
          <TabsList>
            <TabsTrigger value="specs">Specifications</TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews
              <Badge variant="secondary" className="ml-2">
                {product.review_count}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="discussions">Discussions</TabsTrigger>
          </TabsList>
          <TabsContent value="specs" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(product.specs).map(([key, value]) => (
                key !== 'additional_images' && (
                  <div key={key} className="space-y-1">
                    <p className="text-sm text-white/50 capitalize">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm font-medium text-white/90">{String(value)}</p>
                  </div>
                )
              ))}
            </div>
          </TabsContent>
          <TabsContent value="reviews">
            <ProductReviews productId={product.id} />
          </TabsContent>
          <TabsContent value="discussions">
            <ProductThreads productId={product.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}