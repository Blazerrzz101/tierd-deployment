"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Star, ShoppingCart, Heart, Share2, MessageSquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Product } from "@/hooks/use-product"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { ProductReviews } from "@/components/product-reviews"
import { ProductThreads } from "@/components/product-threads"
import { useRouter } from "next/navigation"

interface ProductDetailsProps {
  product: Product
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const { toast } = useToast()
  const { addToCart } = useCart()
  const { addToWishlist } = useWishlist()
  const router = useRouter()

  const images = [product.image_url, ...Object.values(product.specs.images || {})]

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Product Images */}
      <div className="space-y-4">
        <motion.div 
          className="relative aspect-square rounded-lg overflow-hidden bg-zinc-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Image
            src={images[selectedImage]}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </motion.div>
        
        {/* Thumbnail Gallery */}
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
                alt={`${product.name} - View ${index + 1}`}
                fill
                className="object-cover"
                sizes="25vw"
              />
            </button>
          ))}
        </div>
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
                    i < Math.floor(product.rating)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              ({product.review_count} reviews)
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-2xl font-bold">${product.price.toFixed(2)}</p>
          <Badge
            variant={
              product.stock_status === "in_stock"
                ? "default"
                : product.stock_status === "low_stock"
                ? "warning"
                : "destructive"
            }
          >
            {product.stock_status.replace("_", " ").toUpperCase()}
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
            <p className="text-gray-600">{product.description}</p>
          </TabsContent>
          <TabsContent value="specifications" className="mt-4">
            <div className="space-y-4">
              {Object.entries(product.specs)
                .filter(([key]) => key !== "images")
                .map(([key, value]) => (
                  <div key={key} className="grid grid-cols-2 gap-4">
                    <div className="font-medium capitalize">
                      {key.replace(/_/g, " ")}
                    </div>
                    <div>{value}</div>
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