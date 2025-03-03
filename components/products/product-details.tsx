"use client"

import { useState, useRef } from "react"
import { 
  Star, ShoppingCart, Heart, Share2, MessageSquarePlus, 
  ChevronLeft, ChevronRight, Zap, Shield, Award, 
  Check, X, Clock, Users, ArrowUpRight, ThumbsUp, ThumbsDown
} from "lucide-react"
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
import { ProductImage } from "@/components/ui/product-image-fixed"
import { RelatedProducts } from "@/components/products/related-products"
import { ProductComparison } from "@/components/products/product-comparison"
import { cn, formatTimeAgo } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useAuth, AuthUser } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

interface ProductDetailsProps {
  product: Product
}

// Extended product type with optional properties
interface ExtendedProduct extends Product {
  is_new?: boolean;
  is_featured?: boolean;
  discount_percent?: number;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const { addToCart } = useCart()
  const { addToWishlist, isInWishlist } = useWishlist()
  const { vote } = useVote()
  const { toast } = useToast()
  const { user } = useAuth()
  const authUser = user as AuthUser | null
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("specifications")
  const [mainImage, setMainImage] = useState(product?.image_url || "")
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showZoomedImage, setShowZoomedImage] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const [selectedColor, setSelectedColor] = useState("black")
  const [quantity, setQuantity] = useState(1)
  
  // Cast product to extended type
  const extendedProduct = product as ExtendedProduct
  
  // Sample gallery images (in a real app, these would come from the product)
  const galleryImages = [
    product?.image_url || "",
    `/images/placeholders/${product?.category || "monitors"}/1.webp`,
    `/images/placeholders/${product?.category || "monitors"}/2.webp`,
    `/images/placeholders/${product?.category || "monitors"}/3.webp`,
  ]

  // Sample color options
  const colorOptions = ["black", "white", "silver", "blue"]
  
  const scrollImages = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return
    
    const container = scrollContainerRef.current
    const scrollAmount = 200
    
    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

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
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      }).catch(err => {
        console.error('Error sharing:', err)
      })
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link Copied",
        children: "Product link copied to clipboard",
      })
    }
  }
  
  const getAverageRating = () => {
    if (!product.reviews || product.reviews.length === 0) return 0
    
    const total = product.reviews.reduce((sum, review) => sum + review.rating, 0)
    return total / product.reviews.length
  }
  
  const getRatingDistribution = () => {
    if (!product.reviews || product.reviews.length === 0) {
      return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    }
    
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    
    product.reviews.forEach(review => {
      const rating = Math.round(review.rating)
      if (rating >= 1 && rating <= 5) {
        distribution[rating as keyof typeof distribution]++
      }
    })
    
    return distribution
  }

  // Image zoom functionality
  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!showZoomedImage) return
    
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    
    setZoomPosition({ x, y })
  }
  
  const toggleZoom = () => {
    setShowZoomedImage(!showZoomedImage)
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
    .map(([pro, count]) => ({ text: pro, count }))
  
  const cons = Object.entries(consCount)
    .sort(([,a], [,b]) => b - a)
    .map(([con, count]) => ({ text: con, count }))
    
  const totalReviewCount = product.reviews?.length || 0
  const averageRating = getAverageRating()
  const ratingDistribution = getRatingDistribution()

  return (
    <div className="container pb-12 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
        {/* Product Images - Left Column */}
        <div className="space-y-4">
          {/* Main image with zoom effect */}
          <div 
            className="relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-card to-card-background aspect-square flex items-center justify-center"
            onMouseMove={handleImageMouseMove}
            onMouseEnter={() => setShowZoomedImage(true)}
            onMouseLeave={() => setShowZoomedImage(false)}
            onClick={toggleZoom}
          >
            <div className="relative w-full h-full cursor-zoom-in">
              <ProductImage 
                src={mainImage} 
                alt={product.name}
                className="object-contain w-full h-full transition-all"
              />
              
              {showZoomedImage && (
                <div 
                  className="absolute inset-0 bg-no-repeat bg-cover opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    backgroundImage: `url(${mainImage})`,
                    backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    transform: 'scale(1.5)'
                  }}
                />
              )}
            </div>
            
            {extendedProduct.is_new && (
              <Badge variant="secondary" className="absolute top-4 left-4 animate-pulse">
                NEW
              </Badge>
            )}
            
            {extendedProduct.discount_percent && (
              <Badge variant="destructive" className="absolute top-4 right-4">
                {extendedProduct.discount_percent}% OFF
              </Badge>
            )}
          </div>
          
          {/* Thumbnails */}
          <div className="relative">
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
              onClick={() => scrollImages('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div 
              ref={scrollContainerRef}
              className="flex space-x-2 overflow-x-auto px-8 py-2 scrollbar-hide mask-edges"
            >
              {galleryImages.map((img, i) => (
                <div 
                  key={i}
                  className={cn(
                    "flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2 transition-all w-20 h-20",
                    mainImage === img ? "border-primary ring-2 ring-primary ring-opacity-50" : "border-border"
                  )}
                  onClick={() => setMainImage(img)}
                >
                  <ProductImage 
                    src={img} 
                    alt={`${product.name} - view ${i+1}`}
                    className="object-cover w-full h-full"
                  />
                </div>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
              onClick={() => scrollImages('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Product Details - Right Column */}
        <div className="space-y-6">
          {/* Product header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
              
              <div className="flex items-center gap-2">
                <VoteButtons 
                  product={product}
                  initialUpvotes={product.upvotes || 0}
                  initialDownvotes={product.downvotes || 0}
                  initialVoteType={typeof product.userVote === 'number' ? product.userVote : null}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                <span className="font-medium">{product.rating || 4.5}</span>
                <span className="text-muted-foreground">
                  /5 ({product.review_count || 42} reviews)
                </span>
              </div>
              
              <span className="text-muted-foreground">•</span>
              
              <Badge variant="outline" className="font-normal">
                {product.category}
              </Badge>
              
              {extendedProduct.is_featured && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <Badge variant="secondary" className="bg-secondary/20 text-secondary">
                    <Award className="h-3 w-3 mr-1" /> Featured
                  </Badge>
                </>
              )}
            </div>
          </div>
          
          <Separator />
          
          {/* Price and purchase options */}
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">${product.price}</span>
              
              {extendedProduct.discount_percent && (
                <span className="text-xl line-through text-muted-foreground">
                  ${(product.price / (1 - extendedProduct.discount_percent / 100)).toFixed(2)}
                </span>
              )}
              
              <span className="ml-2 text-sm text-muted-foreground">+ Free shipping</span>
            </div>
            
            {/* Color options */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Color: <span className="capitalize">{selectedColor}</span></p>
              <div className="flex gap-2">
                {colorOptions.map(color => (
                  <TooltipProvider key={color}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all",
                            selectedColor === color ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => setSelectedColor(color)}
                          aria-label={color}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="capitalize">{color}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
            
            {/* Quantity selector */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Quantity</p>
              <div className="flex items-center border border-border rounded-md w-32">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-none"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <span>-</span>
                </Button>
                <div className="flex-1 text-center">{quantity}</div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-none"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <span>+</span>
                </Button>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleAddToCart} 
                size="lg" 
                className="flex-1 gap-2 group"
              >
                <ShoppingCart className="h-4 w-4 group-hover:animate-bounce" />
                Add to Cart
              </Button>
              
              <Button 
                onClick={handleAddToWishlist} 
                variant="outline" 
                size="lg" 
                className="flex-1 gap-2 group"
              >
                <Heart 
                  className={cn(
                    "h-4 w-4 transition-colors group-hover:fill-red-500 group-hover:text-red-500",
                    isInWishlist(product.id) ? "fill-red-500 text-red-500" : ""
                  )} 
                />
                {isInWishlist(product.id) ? "In Wishlist" : "Add to Wishlist"}
              </Button>
              
              <Button 
                onClick={handleShare} 
                variant="outline" 
                size="icon" 
                className="group"
              >
                <Share2 className="h-4 w-4 group-hover:text-primary" />
              </Button>
            </div>
          </div>
          
          <Separator />
          
          {/* Key features highlights */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card-background/50 border-border/50">
              <CardContent className="p-3 flex items-center gap-2">
                <div className="rounded-full bg-primary/10 p-2">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div className="text-sm">Fast Shipping</div>
              </CardContent>
            </Card>
            
            <Card className="bg-card-background/50 border-border/50">
              <CardContent className="p-3 flex items-center gap-2">
                <div className="rounded-full bg-primary/10 p-2">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div className="text-sm">2-Year Warranty</div>
              </CardContent>
            </Card>
            
            <Card className="bg-card-background/50 border-border/50">
              <CardContent className="p-3 flex items-center gap-2">
                <div className="rounded-full bg-primary/10 p-2">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div className="text-sm">30-Day Returns</div>
              </CardContent>
            </Card>
            
            <Card className="bg-card-background/50 border-border/50">
              <CardContent className="p-3 flex items-center gap-2">
                <div className="rounded-full bg-primary/10 p-2">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="text-sm">24/7 Support</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Short description */}
          <div className="space-y-2 text-muted-foreground">
            <p className="line-clamp-3">{product.description}</p>
            <Button variant="link" className="px-0" onClick={() => setActiveTab("description")}>
              Read More <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Full details section */}
      <div className="mt-10">
        <Tabs defaultValue="specifications" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="discussion">Discussion</TabsTrigger>
          </TabsList>
          
          <TabsContent value="specifications" className="space-y-8 mt-4 bg-white/5 p-6 rounded-xl">
            <div>
              <h2 className="text-2xl font-semibold">Technical Specifications</h2>
              <p className="mt-2 text-muted-foreground">
                Detailed specifications for {product.name}
              </p>
              
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {specifications.map(([key, value], index) => (
                  <div
                    key={key}
                    className={cn(
                      "flex flex-col gap-1 border-b border-white/10 pb-4",
                      index >= specifications.length - 2 && "border-b-0"
                    )}
                  >
                    <span className="text-sm font-medium text-muted-foreground">{key}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="description" className="space-y-8 mt-4">
            <div className="grid gap-8 lg:grid-cols-5">
              {/* Rating Distribution */}
              <div className="lg:col-span-2 space-y-6 bg-white/5 p-6 rounded-xl">
                <div>
                  <h3 className="text-xl font-semibold">Rating Distribution</h3>
                  <p className="text-sm text-muted-foreground mt-1">Based on {totalReviewCount} reviews</p>
                </div>
                
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map(rating => {
                    const count = ratingDistribution[rating as keyof typeof ratingDistribution] || 0
                    const percentage = totalReviewCount > 0 ? (count / totalReviewCount) * 100 : 0
                    
                    return (
                      <div key={rating} className="flex items-center gap-4">
                        <div className="flex items-center gap-1 min-w-[60px]">
                          <Star className={cn(
                            "h-4 w-4",
                            rating >= 4 ? "text-yellow-400" : 
                            rating === 3 ? "text-amber-400" : "text-muted-foreground"
                          )} />
                          <span className="text-sm">{rating}</span>
                        </div>
                        <Progress value={percentage} className="h-2 flex-1" />
                        <div className="text-sm text-muted-foreground min-w-[40px] text-right">
                          {count}
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Star 
                          key={rating}
                          className={cn(
                            "h-5 w-5",
                            averageRating >= rating 
                              ? "fill-yellow-400 text-yellow-400" 
                              : averageRating >= rating - 0.5 
                                ? "fill-yellow-400/50 text-yellow-400" 
                                : "fill-transparent text-muted-foreground"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Overall rating based on user reviews
                  </p>
                </div>
              </div>
              
              {/* Pros and Cons */}
              <div className="lg:col-span-3 grid gap-6 md:grid-cols-2">
                {/* Pros */}
                <div className="space-y-4 bg-white/5 p-6 rounded-xl">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <ThumbsUp className="h-5 w-5 text-green-500" />
                    What Users Like
                  </h3>
                  
                  <ul className="space-y-3">
                    {pros.slice(0, 5).map((pro, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <span className="font-medium">{pro.text}</span>
                          <div className="mt-1 flex items-center gap-1">
                            <Progress value={(pro.count / totalReviewCount) * 100} className="h-1 w-20 bg-white/10" />
                            <span className="text-xs text-muted-foreground">
                              {pro.count} {pro.count === 1 ? 'mention' : 'mentions'}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                    
                    {pros.length === 0 && (
                      <li className="text-muted-foreground">No pros mentioned yet</li>
                    )}
                  </ul>
                </div>
                
                {/* Cons */}
                <div className="space-y-4 bg-white/5 p-6 rounded-xl">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <ThumbsDown className="h-5 w-5 text-red-500" />
                    What Users Dislike
                  </h3>
                  
                  <ul className="space-y-3">
                    {cons.slice(0, 5).map((con, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <X className="h-5 w-5 text-red-500 mt-0.5" />
                        <div>
                          <span className="font-medium">{con.text}</span>
                          <div className="mt-1 flex items-center gap-1">
                            <Progress value={(con.count / totalReviewCount) * 100} className="h-1 w-20 bg-white/10" />
                            <span className="text-xs text-muted-foreground">
                              {con.count} {con.count === 1 ? 'mention' : 'mentions'}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                    
                    {cons.length === 0 && (
                      <li className="text-muted-foreground">No cons mentioned yet</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            <div className="bg-white/5 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold mb-6">User Reviews</h2>
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
            </div>
          </TabsContent>

          <TabsContent value="discussion" className="mt-4">
            <div className="bg-white/5 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold mb-6">Discussions</h2>
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
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Related Products */}
      <div className="mt-12 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Related Products</h2>
          <Button variant="outline" size="sm" className="gap-1">
            View All <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
        <RelatedProducts product={product} limit={4} />
      </div>
    </div>
  )
}