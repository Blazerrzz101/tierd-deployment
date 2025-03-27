"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Product } from "@/utils/product-utils"
import { createProductUrl } from "@/utils/product-utils"
import { getProductAffiliateLinkAndImage } from "@/utils/affiliate-utils"
import { getEnhancedProductImage, getAlternateProductImages } from "@/utils/enhanced-images"
import { GlobalVoteButtons } from "@/components/products/global-vote-buttons"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { 
  ShareIcon, 
  Star, 
  Tag, 
  ArrowLeft, 
  ShoppingCart, 
  Zap,
  Award,
  ExternalLink,
  Share,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { mockProducts } from "@/utils/product-utils"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { ProductVoteWrapper } from "@/components/products/product-vote-wrapper"

interface UnifiedProductDetailProps {
  product: Product;
  includeNavigationButtons?: boolean;
}

/**
 * UnifiedProductDetail - A standardized component for displaying product details
 * with consistent UI across all product pages
 */
export function UnifiedProductDetail({ product, includeNavigationButtons = true }: UnifiedProductDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [affiliateLink, setAffiliateLink] = useState("");
  const [enhancedImage, setEnhancedImage] = useState<string | undefined>(undefined);
  const [alternateImages, setAlternateImages] = useState<string[] | undefined>(undefined);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Format price if available
  const formattedPrice = product.price 
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price)
    : undefined;
  
  // Get brand and category
  const brand = ((product as any).brand || product.name.split(' ')[0]);
  const category = product.category || "Unknown";
  
  // Calculate rating score
  const votesCount = (product.upvotes || 0) + (product.downvotes || 0);
  const voteScore = (product.upvotes || 0) - (product.downvotes || 0);
  const ratingStar = product.rating || ((product.upvotes || 0) / Math.max(votesCount, 1)) * 5 || 0;

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
    const similar = mockProducts
      .filter(p => 
        p.id !== product.id && 
        (p.category === product.category || 
         p.name.toLowerCase().includes(brand.toLowerCase()))
      )
      .slice(0, 4);
    
    setSimilarProducts(similar);
  }, [product, brand]);

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

  // Extract specs from product
  const specs = product.specifications || (product as any).specs || {};
  
  // Get current main image source
  const currentMainImage = () => {
    if (alternateImages && alternateImages.length > 0 && currentImageIndex < alternateImages.length) {
      return alternateImages[currentImageIndex];
    }
    return enhancedImage || product.imageUrl || product.image_url || '/images/product-placeholder.png';
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      {/* Back to category link */}
      {product.category && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-6 text-muted-foreground hover:text-foreground"
          onClick={() => router.push(`/rankings?category=${product.category}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {product.category.replace('-', ' ')}
        </Button>
      )}
      
      {/* Product title for mobile only */}
      <div className="mb-8 md:hidden">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {brand && (
            <Badge variant="outline" className="font-normal">
              {brand}
            </Badge>
          )}
          {category && (
            <Badge variant="secondary" className="font-normal">
              {category.replace(/-/g, ' ')}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Product header and content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column - Image and vote buttons */}
        <div className="lg:col-span-5">
          <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/5 aspect-square">
            <Image
              src={currentMainImage()}
              alt={product.name}
              fill
              className="object-contain p-6"
              priority
              sizes="(max-width: 768px) 100vw, 500px"
            />
            
            {alternateImages && alternateImages.length > 0 && (
              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button 
                  variant="secondary" 
                  size="icon" 
                  onClick={goToPreviousProduct}
                  className="h-8 w-8 bg-black/60 backdrop-blur-sm hover:bg-black/80 rounded-full"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  onClick={goToNextProduct}
                  className="h-8 w-8 bg-black/60 backdrop-blur-sm hover:bg-black/80 rounded-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {enhancedImage && (
              <Badge className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm">
                HD Image
              </Badge>
            )}
          </div>
          
          {/* Thumbnail images */}
          {alternateImages && alternateImages.length > 0 && (
            <div className="grid grid-flow-col gap-2 mt-4 overflow-auto py-2">
              <Button 
                variant={currentImageIndex === 0 ? "default" : "outline"}
                size="sm" 
                className="h-16 w-16 p-0 overflow-hidden rounded-md"
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
              
              {alternateImages.map((image, index) => (
                <Button 
                  key={`thumb-${index}`}
                  variant={currentImageIndex === index + 1 ? "default" : "outline"}
                  size="sm" 
                  className="h-16 w-16 p-0 overflow-hidden rounded-md"
                  onClick={() => setCurrentImageIndex(index + 1)}
                >
                  <div className="relative h-full w-full">
                    <Image
                      src={image}
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
          
          <div className="flex justify-center mt-8">
            {/* Use GlobalVoteButtons directly for consistent vote tracking */}
            <GlobalVoteButtons 
              key={`vote-${product.id}`} 
              product={product} 
              className="mx-auto" 
            />
          </div>
        </div>
        
        {/* Right column - Product details */}
        <div className="lg:col-span-7">
          {/* Product header - desktop only */}
          <div className="hidden md:block mb-6">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="outline" className="font-normal">
                {brand}
              </Badge>
              <Badge variant="secondary" className="font-normal flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {category.replace(/-/g, ' ')}
              </Badge>
              {product.rating && (
                <div className="flex items-center">
                  <Star className="mr-1 h-3 w-3 fill-primary text-primary" />
                  <span>{product.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Product description */}
          <p className="text-muted-foreground mb-6">
            {product.description || `Premium ${category.replace(/-/g, ' ')} with studio-quality sound.`}
          </p>
          
          {/* Key highlights */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {formattedPrice && (
              <div className="flex items-center rounded-md bg-muted px-3 py-2 text-sm">
                <strong className="mr-2">Price:</strong>
                <span>{formattedPrice}</span>
              </div>
            )}
            
            <div className="flex items-center rounded-md bg-muted px-3 py-2 text-sm">
              <strong className="mr-2">Category:</strong>
              <span className="capitalize">{category.replace(/-/g, ' ')}</span>
            </div>
            
            <div className="flex items-center rounded-md bg-muted px-3 py-2 text-sm">
              <strong className="mr-2">Rating:</strong>
              <span className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={cn(
                      "h-3 w-3", 
                      i < Math.round(ratingStar) 
                        ? "fill-primary text-primary" 
                        : "text-muted-foreground"
                    )} 
                  />
                ))}
              </span>
            </div>
            
            <div className="flex items-center rounded-md bg-muted px-3 py-2 text-sm">
              <strong className="mr-2">Votes:</strong>
              <span>{votesCount}</span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mb-8">
            {affiliateLink && (
              <Button 
                className="gap-2"
                onClick={() => window.open(affiliateLink, '_blank')}
              >
                <ShoppingCart className="h-4 w-4" />
                Shop on Amazon
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            )}
            
            <Button 
              variant="outline"
              className="gap-2"
              onClick={shareProduct}
            >
              <Share className="h-4 w-4" />
              Share
            </Button>
          </div>
          
          {/* Specs tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="specs">Specifications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="pt-2">
              {product.description ? (
                <div className="prose prose-invert max-w-none">
                  <p>{product.description}</p>
                  <p>The {product.name} is a {brand} product in the {category.replace('-', ' ')} category.</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No overview available for this product.</p>
              )}
            </TabsContent>
            
            <TabsContent value="specs" className="pt-2">
              {Object.keys(specs).length > 0 ? (
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      Technical Specifications
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(specs).slice(0, Math.ceil(Object.keys(specs).length / 2)).map(([key, value]) => (
                        <div key={key} className="grid grid-cols-2 gap-4 border-b border-border/50 pb-2">
                          <div className="text-sm text-muted-foreground">{key}</div>
                          <div className="text-sm font-medium">{value as string}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      Features & Details
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(specs).slice(Math.ceil(Object.keys(specs).length / 2)).map(([key, value]) => (
                        <div key={key} className="grid grid-cols-2 gap-4 border-b border-border/50 pb-2">
                          <div className="text-sm text-muted-foreground">{key}</div>
                          <div className="text-sm font-medium">{value as string}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No specifications available for this product.</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6">Similar Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {similarProducts.map((p) => (
              <ProductVoteWrapper key={p.id} product={p}>
                {(voteData) => (
                  <Link 
                    href={createProductUrl(p)}
                    className="block group"
                  >
                    <Card className="overflow-hidden transition-all hover:shadow-md h-full">
                      <div className="relative aspect-square bg-muted/40">
                        <Image
                          src={getEnhancedProductImage(p.name) || p.imageUrl || p.image_url || '/images/product-placeholder.png'}
                          alt={p.name}
                          fill
                          className="object-contain p-4"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      </div>
                      <CardContent className="p-4 h-full">
                        <div className="mb-2">
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                            {(p as any).brand || p.name.split(' ')[0]}
                          </Badge>
                        </div>
                        <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">{p.name}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs text-muted-foreground">
                            {p.rating?.toFixed(1) || ((voteData.upvotes || 0) / Math.max((voteData.upvotes || 0) + (voteData.downvotes || 0), 1) * 5).toFixed(1)} 
                            · {((voteData.upvotes || 0) + (voteData.downvotes || 0))} votes
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )}
              </ProductVoteWrapper>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 