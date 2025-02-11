"use client"

import { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Star, ShoppingCart, Heart, Share2, MessageSquarePlus, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Product } from "@/hooks/use-product"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { ProductReviews } from "@/components/products/product-reviews"
import { ProductThreads } from "@/components/products/product-threads"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface ProductDetailsProps {
  product: Product
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [isRotating, setIsRotating] = useState(false)
  const { toast } = useToast()
  const { addToCart } = useCart()
  const { addToWishlist } = useWishlist()
  const router = useRouter()

  const images = [
    product.image_url,
    ...(product.details?.images ? Object.values(product.details.images) : [])
  ].filter(Boolean) as string[]

  const handleAddToCart = () => {
    addToCart(product)
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`
    })
  }

  const handleAddToWishlist = () => {
    addToWishlist(product)
    toast({
      title: "Added to Wishlist",
      description: `${product.name} has been added to your wishlist.`
    })
  }

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length)
  }

  const previousImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length)
  }

  const toggleRotation = () => {
    setIsRotating((prev) => !prev)
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
              <Image
                src={images[selectedImage]}
                alt={`${product.name} - View ${selectedImage + 1}`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
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
                <Image
                  src={image}
                  alt={`${product.name} - Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="25vw"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(product.rating || 0)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              ({product.review_count || 0} reviews)
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-2xl font-bold">${product.price.toFixed(2)}</p>
          <Badge
            variant={
              (product.stock_status || "in_stock") === "in_stock"
                ? "default"
                : (product.stock_status || "in_stock") === "low_stock"
                ? "warning"
                : "destructive"
            }
          >
            {(product.stock_status || "in_stock").replace("_", " ").toUpperCase()}
          </Badge>
        </div>

        <div className="space-y-4">
          <Button 
            size="lg" 
            className="w-full"
            onClick={handleAddToCart}
            disabled={product.stock_status === "out_of_stock"}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Add to Cart
          </Button>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={handleAddToWishlist}>
              <Heart className="mr-2 h-5 w-5" />
              Wishlist
            </Button>
            <Button variant="outline">
              <Share2 className="mr-2 h-5 w-5" />
              Share
            </Button>
          </div>
        </div>

        <Tabs defaultValue="description">
          <TabsList className="w-full">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-4">
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          </TabsContent>
          <TabsContent value="specifications" className="mt-4">
            <div className="space-y-4">
              {Object.entries(product.details)
                .filter(([key]) => key !== "images")
                .map(([key, value]) => (
                  <div key={key} className="grid grid-cols-2 gap-4 py-2 border-b border-gray-100">
                    <div className="font-medium capitalize text-gray-900">
                      {key.replace(/_/g, " ")}
                    </div>
                    <div className="text-gray-600">{String(value)}</div>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Product Reviews */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8">Reviews</h2>
          <ProductReviews productId={product.id} />
        </div>

        {/* Product Threads */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Discussions</h2>
            <Button onClick={() => router.push(`/threads/new?product=${product.id}`)}>
              <MessageSquarePlus className="mr-2 h-5 w-5" />
              New Thread
            </Button>
          </div>
          <ProductThreads productId={product.id} />
        </div>
      </div>
    </div>
  )
}