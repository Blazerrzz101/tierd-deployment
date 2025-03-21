"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Product } from "@/utils/product-utils"
import { createProductUrl } from "@/utils/product-utils"
import { getProductAffiliateLinkAndImage } from "@/utils/affiliate-utils"
import { getEnhancedProductImage, getAlternateProductImages } from "@/utils/enhanced-images"
import { VoteButtons } from "@/components/products/vote-buttons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { 
  ShareIcon, 
  Star, 
  Tag, 
  FileText, 
  ArrowLeft, 
  ShoppingCart, 
  Clock, 
  Check,
  ChevronRight,
  Zap,
  Award,
  ThumbsUp,
  ExternalLink,
  Share,
  DollarSign
} from "lucide-react"
import { useRouter } from "next/navigation"
import { mockProducts } from "@/app/api/products/route"

interface ProductDetailProps {
  product: Product
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [affiliateLink, setAffiliateLink] = useState("")
  const [enhancedImage, setEnhancedImage] = useState<string | undefined>(undefined)
  const [alternateImages, setAlternateImages] = useState<string[] | undefined>(undefined)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Format price if available
  const formattedPrice = product.price 
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price)
    : "Price not available"

  // Get affiliate link and enhanced images on component mount
  useEffect(() => {
    // Get affiliate link
    const { affiliateLink } = getProductAffiliateLinkAndImage(product.name)
    setAffiliateLink(affiliateLink)
    
    // Get enhanced images
    const enhancedImg = getEnhancedProductImage(product.name, product.category)
    setEnhancedImage(enhancedImg)
    
    // Get alternate images if available
    const alternateImgs = getAlternateProductImages(product.name)
    setAlternateImages(alternateImgs)
  }, [product.name, product.category])

  // Handle image navigation
  const nextImage = () => {
    if (alternateImages && alternateImages.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % alternateImages.length)
    }
  }

  const prevImage = () => {
    if (alternateImages && alternateImages.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + alternateImages.length) % alternateImages.length)
    }
  }

  // Get current image to display
  const currentImage = alternateImages && alternateImages.length > 0 
    ? alternateImages[currentImageIndex] 
    : (product.image || enhancedImage || '')

  // Find related products (same category, excluding current product)
  const relatedProducts = mockProducts
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  // Handle Shop Now button click
  const handleShopNow = () => {
    window.open(affiliateLink, "_blank")
  }

  return (
    <div className="container mx-auto pb-16">
      {/* Hero section with background gradient */}
      <div className="relative w-full mb-12 -mt-8 bg-gradient-to-b from-primary/5 to-transparent pt-16 pb-8 rounded-b-3xl overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/60 to-secondary/60"></div>
        <div className="absolute -top-[500px] -left-[300px] w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute -top-[400px] -right-[200px] w-[700px] h-[700px] rounded-full bg-secondary/5 blur-3xl"></div>

        <div className="container relative z-10">
          {/* Breadcrumb and back button */}
          <div className="flex items-center mb-8">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-4 group">
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back
            </Button>
            <div className="text-sm text-muted-foreground flex items-center">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3 mx-2 text-muted-foreground/50" />
              <Link href="/products" className="hover:text-primary transition-colors">Products</Link>
              <ChevronRight className="h-3 w-3 mx-2 text-muted-foreground/50" />
              <Link 
                href={`/products?category=${product.category}`} 
                className="hover:text-primary transition-colors capitalize"
              >
                {product.category?.replace(/-/g, ' ')}
              </Link>
              <ChevronRight className="h-3 w-3 mx-2 text-muted-foreground/50" />
              <span className="truncate max-w-[150px]">{product.name}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Product image with gallery effect */}
            <div className="relative">
              <div className="relative aspect-square overflow-hidden rounded-xl border shadow-lg shadow-black/5 bg-gradient-to-br from-white/10 to-white/5 p-2">
                {currentImage ? (
                  <>
                    <Image
                      src={currentImage}
                      alt={product.name}
                      fill
                      className="object-cover rounded-lg"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                    />
                    
                    {/* Image navigation controls */}
                    {alternateImages && alternateImages.length > 1 && (
                      <>
                        <button 
                          onClick={prevImage} 
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 backdrop-blur-sm transition-colors"
                          aria-label="Previous image"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <path d="m15 18-6-6 6-6"/>
                          </svg>
                        </button>
                        <button 
                          onClick={nextImage} 
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 backdrop-blur-sm transition-colors"
                          aria-label="Next image"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <path d="m9 18 6-6-6-6"/>
                          </svg>
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <FileText className="h-16 w-16 text-muted-foreground/40" />
                  </div>
                )}
                
                {/* Enhanced image badge if using enhanced image */}
                {enhancedImage && !product.image && currentImage === enhancedImage && (
                  <div className="absolute bottom-3 right-3 bg-gradient-to-r from-primary to-primary/80 text-white text-xs px-2 py-1 rounded font-medium">
                    Enhanced Image
                  </div>
                )}
                
                {/* Image gallery indicators */}
                {alternateImages && alternateImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                    {alternateImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          currentImageIndex === index ? 'bg-white' : 'bg-white/40'
                        }`}
                        aria-label={`View image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {/* Small image thumbnails */}
              {alternateImages && alternateImages.length > 1 && (
                <div className="hidden md:flex justify-center mt-4 space-x-2">
                  {alternateImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-20 h-20 rounded-md overflow-hidden relative border-2 transition-colors ${
                        currentImageIndex === index ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <Image 
                        src={img} 
                        alt={`${product.name} - view ${index + 1}`} 
                        fill 
                        className="object-cover"
                      />
                      <div className={`absolute inset-0 ${
                        currentImageIndex === index ? 'bg-black/0' : 'bg-black/20'
                      } transition-colors`}></div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product info */}
            <div className="flex flex-col">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{product.name}</h1>
              
              <div className="flex items-center mt-3 flex-wrap gap-2">
                {product.brand && (
                  <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary font-medium">
                    {product.brand}
                  </Badge>
                )}
                
                {product.category && (
                  <Badge variant="outline" className="capitalize border-secondary/20 bg-secondary/5 text-secondary">
                    {product.category.replace(/-/g, ' ')}
                  </Badge>
                )}

                {product.rating && (
                  <Badge variant="outline" className="border-yellow-400/30 bg-yellow-50/30 text-yellow-700 flex items-center">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                    {product.rating.toFixed(1)}
                    <span className="text-xs ml-1 text-muted-foreground">({product.review_count || 0})</span>
                  </Badge>
                )}
              </div>
              
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {product.description}
              </p>
              
              {/* Price and CTA buttons */}
              <div className="mt-6 flex items-baseline">
                <span className="text-3xl font-bold text-foreground mr-2">{formattedPrice}</span>
                {product.price && product.price > 100 && (
                  <span className="text-sm text-green-600 font-medium">Free shipping</span>
                )}
              </div>
              
              {/* Product actions */}
              <div className="flex flex-col gap-4 mt-6">
                {affiliateLink && (
                  <Button 
                    onClick={handleShopNow} 
                    className="w-full bg-gradient-to-br from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Shop on Amazon
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                )}
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="flex-1">
                    <Share className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
                
                {/* Vote section */}
                <div className="bg-card rounded-lg p-4 border flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Is this product worth it?</div>
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      User Review
                    </Badge>
                  </div>
                  <div className="flex items-center justify-center">
                    <VoteButtons
                      product={{ id: product.id, name: product.name }}
                      initialUpvotes={product.votes?.upvotes || 0}
                      initialDownvotes={product.votes?.downvotes || 0}
                      initialVoteType={product.userVote || null}
                    />
                  </div>
                </div>
              </div>
              
              {/* Key highlights */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Key Highlights</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Price comparison */}
                  {formattedPrice && (
                    <div className="flex gap-3 items-start p-3 rounded-lg border bg-card">
                      <div className="rounded-full bg-primary/10 p-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Current Price</div>
                        <div className="text-sm text-muted-foreground">
                          {formattedPrice}
                          {affiliateLink && (
                            <span className="ml-1 text-xs text-primary">
                              (Amazon)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Category */}
                  <div className="flex gap-3 items-start p-3 rounded-lg border bg-card">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Tag className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Category</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {product.category?.replace(/-/g, ' ') || 'General'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Rating */}
                  <div className="flex gap-3 items-start p-3 rounded-lg border bg-card">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Award className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Rating</div>
                      <div className="text-sm text-muted-foreground">
                        {product.rating ? `${product.rating}/5` : 'Not rated yet'}
                      </div>
                    </div>
                  </div>
                  
                  {/* User votes */}
                  <div className="flex gap-3 items-start p-3 rounded-lg border bg-card">
                    <div className="rounded-full bg-primary/10 p-2">
                      <ThumbsUp className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">User Votes</div>
                      <div className="text-sm text-muted-foreground">
                        {(product.votes?.upvotes || 0) + (product.votes?.downvotes || 0)} votes
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>

      {/* Product content tabs */}
      <div className="container">
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="overview" className="text-base py-3">Overview</TabsTrigger>
            <TabsTrigger value="specs" className="text-base py-3">Specifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  Product Details
                </CardTitle>
                <CardDescription>Comprehensive information about this product</CardDescription>
              </CardHeader>
              <CardContent className="prose prose-sm md:prose-base max-w-none">
                {product.description ? (
                  <div>
                    <p className="text-lg leading-relaxed">{product.description}</p>
                    
                    <div className="mt-6 flex flex-col gap-4">
                      <h3 className="text-xl font-semibold">Features & Benefits</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-secondary/5 p-4 rounded-lg border border-secondary/10">
                          <h4 className="font-medium flex items-center text-secondary">
                            <Zap className="h-4 w-4 mr-2" />
                            Performance
                          </h4>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Experience exceptional performance with industry-leading specifications
                            designed for professional users.
                          </p>
                        </div>
                        
                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                          <h4 className="font-medium flex items-center text-primary">
                            <Award className="h-4 w-4 mr-2" />
                            Quality
                          </h4>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Built with premium materials and rigorous quality control to ensure
                            longevity and reliability.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Call to action section */}
                    <div className="mt-8 bg-muted/30 p-6 rounded-xl border">
                      <h3 className="text-xl font-semibold">Why Choose {product.name}?</h3>
                      <p className="mt-2 text-muted-foreground">
                        This premium product offers the perfect balance of features, quality and value.
                        Backed by a manufacturer's warranty and our satisfaction guarantee.
                      </p>
                      <div className="mt-4">
                        <Button>Learn More</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No detailed description available for this product.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="specs" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Tag className="h-5 w-5 mr-2 text-primary" />
                  Technical Specifications
                </CardTitle>
                <CardDescription>Detailed specifications and features</CardDescription>
              </CardHeader>
              <CardContent>
                {product.specs && Object.keys(product.specs).length > 0 ? (
                  <div className="grid grid-cols-1 gap-1">
                    {Object.entries(product.specs).map(([key, value], index) => (
                      <div key={key} className={`py-3 px-4 ${index % 2 === 0 ? 'bg-muted/30 rounded-lg' : ''} flex flex-col sm:flex-row sm:items-center`}>
                        <div className="font-medium text-primary flex-shrink-0 sm:w-1/3">{formatSpecKey(key)}</div>
                        <div className="text-muted-foreground sm:flex-1">{value as string}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No specifications available for this product.</p>
                )}
              </CardContent>
            </Card>
            
            {/* Download section */}
            <Card>
              <CardHeader>
                <CardTitle>Documents & Resources</CardTitle>
                <CardDescription>Download product documentation and resources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-auto py-3 justify-start">
                    <FileText className="h-5 w-5 mr-2" />
                    <div className="text-left">
                      <div className="font-medium">User Manual</div>
                      <div className="text-xs text-muted-foreground">PDF, 2.4MB</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-auto py-3 justify-start">
                    <FileText className="h-5 w-5 mr-2" />
                    <div className="text-left">
                      <div className="font-medium">Specification Sheet</div>
                      <div className="text-xs text-muted-foreground">PDF, 1.2MB</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Related products section */}
      {relatedProducts.length > 0 && (
        <div className="container mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Related Products</h2>
            <Button variant="ghost" className="gap-1">
              View All <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <Link 
                href={createProductUrl(relatedProduct)} 
                key={relatedProduct.id}
                className="group"
              >
                <Card className="overflow-hidden h-full transition-all hover:shadow-md group-hover:-translate-y-1">
                  <div className="aspect-square relative overflow-hidden bg-muted">
                    {relatedProduct.image_url || getEnhancedProductImage(relatedProduct.name, relatedProduct.category) ? (
                      <Image 
                        src={relatedProduct.image_url || getEnhancedProductImage(relatedProduct.name, relatedProduct.category) || ''} 
                        alt={relatedProduct.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <FileText className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                    )}
                    
                    {/* Price badge */}
                    {relatedProduct.price && (
                      <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm font-medium backdrop-blur-sm">
                        ${relatedProduct.price}
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {relatedProduct.description}
                    </p>
                    
                    {/* Rating */}
                    {relatedProduct.rating && (
                      <div className="flex items-center mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3.5 w-3.5 ${
                              star <= Math.round(relatedProduct.rating || 0)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-muted-foreground/20"
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({relatedProduct.review_count || 0})
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper functions
function formatSpecKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'recently';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 1) return 'today';
  if (diffDays < 2) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
} 