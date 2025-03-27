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
  DollarSign,
  Heart,
  Info,
  Layers,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Sparkles
} from "lucide-react"
import { useRouter } from "next/navigation"
import { mockProducts } from "@/utils/product-utils"
import { toast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

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
  const [similarProducts, setSimilarProducts] = useState<Product[]>([])
  const [showShareOptions, setShowShareOptions] = useState(false)

  // Format price if available
  const formattedPrice = product.price 
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price)
    : undefined
  
  // Get brand and category
  const brand = ((product as any).brand || product.name.split(' ')[0])
  const category = product.category || "Unknown"
  
  // Calculate rating score
  const votesCount = (product.upvotes || 0) + (product.downvotes || 0)
  const voteScore = (product.upvotes || 0) - (product.downvotes || 0)
  const ratingStar = product.rating || ((product.upvotes || 0) / Math.max(votesCount, 1)) * 5 || 0

  // Get affiliate link and enhanced image on component mount
  useEffect(() => {
    // Get affiliate link
    const { affiliateLink, imageUrl } = getProductAffiliateLinkAndImage(product.name);
    setAffiliateLink(affiliateLink || "");
    
    // Get enhanced product image
    const enhancedImg = getEnhancedProductImage(product.name);
    if (enhancedImg) {
      setEnhancedImage(enhancedImg);
    }
    
    // Get alternate product images
    const alternateImgs = getAlternateProductImages(product.name);
    if (alternateImgs && alternateImgs.length > 0) {
      setAlternateImages(alternateImgs);
    }
    
    // Find similar products
    findSimilarProducts();
    
    // Log view for analytics
    logProductView();
  }, [product]);

  // Log product view
  const logProductView = async () => {
    try {
      // Log product view - implementation depends on backend
      console.log(`Viewed product: ${product.name}`);
    } catch (error) {
      console.error("Error logging product view:", error);
    }
  };

  // Find similar products
  const findSimilarProducts = () => {
    const similar = mockProducts
      .filter(p => 
        p.id !== product.id && 
        (p.category === product.category || 
         p.name.toLowerCase().includes(brand.toLowerCase()))
      )
      .slice(0, 4);
    
    setSimilarProducts(similar);
  };

  // Navigate to previous product in same category
  const goToPreviousProduct = () => {
    const categoryProducts = mockProducts.filter(p => p.category === product.category);
    const currentIndex = categoryProducts.findIndex(p => p.id === product.id);
    
    if (currentIndex > 0) {
      const prevProduct = categoryProducts[currentIndex - 1];
      router.push(createProductUrl(prevProduct));
    }
  };

  // Navigate to next product in same category
  const goToNextProduct = () => {
    const categoryProducts = mockProducts.filter(p => p.category === product.category);
    const currentIndex = categoryProducts.findIndex(p => p.id === product.id);
    
    if (currentIndex < categoryProducts.length - 1) {
      const nextProduct = categoryProducts[currentIndex + 1];
      router.push(createProductUrl(nextProduct));
    }
  };

  // Share product
  const shareProduct = () => {
    setShowShareOptions(!showShareOptions);
  };

  // Copy product link
  const copyProductLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "Product link copied to clipboard",
    });
    setShowShareOptions(false);
  };

  // Get current main image source
  const currentMainImage = () => {
    if (alternateImages && alternateImages.length > 0 && currentImageIndex < alternateImages.length) {
      return alternateImages[currentImageIndex];
    }
    return enhancedImage || product.imageUrl || product.image_url || '/images/product-placeholder.png';
  };

  // Cycle to next image
  const nextImage = () => {
    if (alternateImages && alternateImages.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % (alternateImages.length + 1));
    }
  };

  // Cycle to previous image
  const prevImage = () => {
    if (alternateImages && alternateImages.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? alternateImages.length : prev - 1
      );
    }
  };

  // Extract specs from product
  const specs = product.specs || product.specifications || {};
  
  // Organized spec groups
  const specGroups = [
    {
      title: "Technical Specifications",
      icon: Zap,
      specs: Object.entries(specs).slice(0, Math.ceil(Object.keys(specs).length / 2))
    },
    {
      title: "Features & Details",
      icon: Layers,
      specs: Object.entries(specs).slice(Math.ceil(Object.keys(specs).length / 2))
    }
  ];

  return (
    <div className="container max-w-7xl mx-auto py-8">
      {/* Back Navigation */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          <div className="text-sm text-muted-foreground hidden md:flex items-center">
            <Link href="/" className="hover:underline">Home</Link>
            <ChevronRight className="h-3 w-3 mx-1" />
            <Link href={`/rankings?category=${product.category}`} className="hover:underline">
              {product.category && product.category.replace('-', ' ')}
            </Link>
            <ChevronRight className="h-3 w-3 mx-1" />
            <span>{product.name}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={goToPreviousProduct}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={goToNextProduct}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Product Image Section */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <motion.div 
              className="relative aspect-square rounded-xl overflow-hidden bg-black/5 border border-white/10"
              layoutId={`product-image-${product.id}`}
              initial={{ opacity: 0.8, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Image
                src={currentMainImage()}
                alt={product.name}
                fill
                className="object-contain p-4"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
              />
              
              {alternateImages && alternateImages.length > 0 && (
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    onClick={prevImage}
                    className="h-8 w-8 bg-black/60 backdrop-blur-md hover:bg-black/80"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    onClick={nextImage}
                    className="h-8 w-8 bg-black/60 backdrop-blur-md hover:bg-black/80"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {enhancedImage && (
                <Badge className="absolute top-4 left-4 bg-black/60 backdrop-blur-md">
                  HD Image
                </Badge>
              )}
            </motion.div>
            
            {/* Thumbnail Navigation */}
            {alternateImages && alternateImages.length > 0 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button 
                  variant={currentImageIndex === 0 ? "default" : "outline"}
                  size="sm" 
                  className="h-16 w-16 p-0 overflow-hidden"
                  onClick={() => setCurrentImageIndex(0)}
                >
                  <div className="relative h-full w-full">
                    <Image
                      src={enhancedImage || product.imageUrl || product.image_url || '/images/product-placeholder.png'}
                      alt={`${product.name} - Main Image`}
                      fill
                      className="object-contain p-1"
                      sizes="64px"
                    />
                  </div>
                </Button>
                
                {alternateImages.map((img, index) => (
                  <Button 
                    key={index}
                    variant={currentImageIndex === index + 1 ? "default" : "outline"}
                    size="sm" 
                    className="h-16 w-16 p-0 overflow-hidden"
                    onClick={() => setCurrentImageIndex(index + 1)}
                  >
                    <div className="relative h-full w-full">
                      <Image
                        src={img}
                        alt={`${product.name} - Image ${index + 1}`}
                        fill
                        className="object-contain p-1"
                        sizes="64px"
                      />
                    </div>
                  </Button>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              {affiliateLink && (
                <Button 
                  variant="default" 
                  size="lg" 
                  className="w-full flex items-center gap-2 bg-gradient-to-r from-primary to-primary-600 hover:opacity-90"
                  asChild
                >
                  <a href={affiliateLink} target="_blank" rel="noopener noreferrer">
                    <ShoppingCart className="h-4 w-4" />
                    Shop Now
                  </a>
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full flex items-center gap-2 relative"
                onClick={shareProduct}
              >
                <Share className="h-4 w-4" />
                Share
                
                <AnimatePresence>
                  {showShareOptions && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full mt-2 right-0 bg-black/90 backdrop-blur-lg border border-white/10 rounded-lg p-2 shadow-xl z-10 w-48"
                    >
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start mb-1 text-sm"
                        onClick={copyProductLink}
                      >
                        <FileText className="h-3 w-3 mr-2" />
                        Copy Link
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start text-sm"
                        asChild
                      >
                        <a 
                          href={`https://twitter.com/intent/tweet?text=Check out this ${product.name} on Tier'd&url=${encodeURIComponent(window.location.href)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" className="mr-2">
                            <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z"/>
                          </svg>
                          Share on Twitter
                        </a>
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="md:col-span-1 lg:col-span-2">
          <div className="space-y-8">
            {/* Product Header */}
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {brand}
                    </Badge>
                    
                    <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                      <Tag className="h-3 w-3 mr-1" />
                      {category.replace('-', ' ')}
                    </Badge>
                    
                    {product.rating && (
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                        <Star className="h-3 w-3 mr-1 fill-yellow-400" />
                        {product.rating.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                  
                  <h1 className="text-3xl font-bold">{product.name}</h1>
                  
                  {product.model && (
                    <p className="text-muted-foreground">Model: {product.model}</p>
                  )}
                </div>
                
                {formattedPrice && (
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted-foreground">Retail Price</span>
                    <span className="text-2xl font-bold text-primary">{formattedPrice}</span>
                  </div>
                )}
              </div>
              
              <p className="text-lg text-white/80 mt-4">
                {product.description}
              </p>
              
              {/* Vote & Score Section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 p-4 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <VoteButtons
                    product={{ id: product.id, name: product.name }}
                    initialUpvotes={product.upvotes || 0}
                    initialDownvotes={product.downvotes || 0}
                    initialVoteType={product.userVote || 0}
                    size="lg"
                  />
                  
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-white mb-1">
                      Score: <span className={voteScore >= 0 ? "text-green-400" : "text-red-400"}>{voteScore}</span>
                    </p>
                    <p>{votesCount} total votes</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div 
                        key={star} 
                        className={cn(
                          "text-white/20",
                          star <= Math.round(ratingStar) && "text-yellow-400"
                        )}
                      >
                        <Star className={cn(
                          "h-5 w-5",
                          star <= Math.round(ratingStar) && "fill-yellow-400"
                        )} />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Community rating
                  </p>
                </div>
              </div>
            </div>
            
            {/* Product Key Features & Specs */}
            <div>
              <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
                  <TabsTrigger value="specifications" className="text-sm">Specifications</TabsTrigger>
                  <TabsTrigger value="alternatives" className="text-sm">Alternatives</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Key Highlights */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          Key Highlights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {Object.entries(specs).slice(0, 4).map(([key, value]) => (
                            <li key={key} className="flex items-start gap-2">
                              <Check className="h-4 w-4 mt-0.5 text-primary" />
                              <div>
                                <span className="font-medium capitalize">{key.replace('_', ' ')}: </span>
                                <span className="text-white/80">{value as string}</span>
                              </div>
                            </li>
                          ))}
                          {specGroups[0].specs.length === 0 && (
                            <li className="text-muted-foreground italic">No specifications available</li>
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                    
                    {/* Pros & Cons */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Award className="h-4 w-4 text-primary" />
                          Pros & Cons
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-green-400 flex items-center gap-2 mb-2">
                              <ThumbsUp className="h-3 w-3" />
                              Strengths
                            </h4>
                            <ul className="space-y-2 pl-5 list-disc text-white/80">
                              <li>High-quality build and finish</li>
                              <li>Excellent performance for the price</li>
                              <li>Good battery life (if applicable)</li>
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-red-400 flex items-center gap-2 mb-2">
                              <ThumbsUp className="h-3 w-3 rotate-180" />
                              Weaknesses
                            </h4>
                            <ul className="space-y-2 pl-5 list-disc text-white/80">
                              <li>May be expensive for some users</li>
                              <li>Software could use improvements</li>
                              <li>Limited customization options</li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Full Description */}
                  <Card className="mt-6">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" />
                        Product Description
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-invert max-w-none">
                      <p className="text-white/80">
                        {product.description}
                      </p>
                      <p className="text-white/80 mt-4">
                        The {product.name} is a high-quality {category.replace('-', ' ')} designed for gamers who demand the best. 
                        Made by {brand}, this {category.replace('-', ' ')} features {Object.entries(specs).slice(0, 2).map(([key, value]) => `${value} ${key}`).join(' and ')}.
                      </p>
                      <p className="text-white/80 mt-4">
                        Whether you're a professional esports player or a casual gamer, the {product.name} offers the performance and reliability you need for an immersive gaming experience.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="specifications" className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {specGroups.map((group, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <group.icon className="h-4 w-4 text-primary" />
                            {group.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <dl className="space-y-4">
                            {group.specs.map(([key, value]) => (
                              <div key={key} className="grid grid-cols-3 gap-2">
                                <dt className="col-span-1 font-medium capitalize text-white/70">{key.replace('_', ' ')}:</dt>
                                <dd className="col-span-2 text-white">{value as string}</dd>
                              </div>
                            ))}
                            {group.specs.length === 0 && (
                              <div className="text-muted-foreground italic">No specifications available</div>
                            )}
                          </dl>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="alternatives" className="pt-6">
                  <Card className="bg-black/20 backdrop-blur-sm border border-white/10">
                    <CardHeader>
                      <CardTitle className="text-lg">Alternative Products</CardTitle>
                      <CardDescription>
                        Similar products to consider in the {category.replace('-', ' ')} category
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {similarProducts.length > 0 ? (
                          similarProducts.map((similarProduct) => (
                            <Button
                              key={similarProduct.id}
                              variant="outline"
                              className="h-auto py-4 px-4 flex items-start gap-4 justify-start"
                              onClick={() => router.push(createProductUrl(similarProduct))}
                            >
                              <div className="h-16 w-16 relative flex-shrink-0 bg-black/20 rounded-md overflow-hidden">
                                <Image
                                  src={similarProduct.imageUrl || similarProduct.image_url || '/images/product-placeholder.png'}
                                  alt={similarProduct.name}
                                  fill
                                  className="object-contain p-1"
                                  sizes="64px"
                                />
                              </div>
                              <div className="text-left">
                                <h4 className="font-medium text-sm">{similarProduct.name}</h4>
                                <p className="text-muted-foreground text-xs mt-1">
                                  {similarProduct.price && `$${similarProduct.price}`}
                                  {similarProduct.price && similarProduct.rating && ' • '}
                                  {similarProduct.rating && `${similarProduct.rating.toFixed(1)} ★`}
                                </p>
                              </div>
                            </Button>
                          ))
                        ) : (
                          <div className="col-span-full text-center py-6 text-muted-foreground">
                            No alternative products found.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 