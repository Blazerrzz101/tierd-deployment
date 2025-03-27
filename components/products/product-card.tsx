"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProductLink } from "@/components/products/product-link"
import { GlobalVoteButtons } from "@/components/products/global-vote-buttons"
import { ProductVoteWrapper } from "@/components/products/product-vote-wrapper"
import { ArrowUpRight, Tag, ExternalLink, Zap } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import Image from "next/image"
import { isValidProduct, createProductUrl } from "@/utils/product-utils"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

// Cooldown period between votes (ms)
const VOTE_COOLDOWN = 1000;

// Funny messages for spam clicks
const SPAM_CLICK_MESSAGES = [
  "Whoa there, eager voter! Your clicks are faster than our servers! ⚡",
  "Easy on the clicks, champ! Even pro gamers need a cooldown. 🎮",
  "Our vote counter needs a breather! Try again in a second. ⏱️",
  "Vote throttled! You're too enthusiastic for our servers! 🚀",
  "Save your APM for StarCraft! Voting has a cooldown. 🌟",
  "Click... wait... click... That's the rhythm we're looking for! 🎵",
];

interface ProductCardProps {
  product: any
  showVotes?: boolean
  showPrice?: boolean
  simpleCard?: boolean
  onTest?: (product: any) => void
}

export function ProductCard({ 
  product, 
  showVotes = true,
  showPrice = true, 
  simpleCard = false,
  onTest
}: ProductCardProps) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  
  // Add state for vote rate limiting
  const [lastVoteTime, setLastVoteTime] = useState(0)
  const [spamClickCount, setSpamClickCount] = useState(0)
  const spamTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Clear spam timer on unmount
  useEffect(() => {
    return () => {
      if (spamTimerRef.current) {
        clearTimeout(spamTimerRef.current)
      }
    }
  }, [])
  
  // Debug product data
  if (process.env.NODE_ENV !== 'production') {
    console.log(`ProductCard rendering product: id=${product?.id}, name=${product?.name}, slug=${product?.url_slug}`);
  }
  
  // Check if the product is valid before rendering
  if (!isValidProduct(product)) {
    return (
      <Card className="overflow-hidden border border-red-200 bg-red-50">
        <CardHeader className="p-4">
          <CardTitle className="text-sm text-red-800">Invalid Product Data</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-xs text-red-600">This product has missing or invalid data.</p>
          {product && (
            <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-20">
              {JSON.stringify(product, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    )
  }

  const imageSrc = product.image || '/images/product-placeholder.png'
  const productUrl = createProductUrl(product)

  // Ensure we have a valid URL, don't use string interpolation directly
  const handleViewProduct = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(productUrl)
  }

  return (
    <div
      className={`overflow-hidden ${isHovered ? 'shadow-md' : 'shadow-sm'} transition-all duration-200`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card>
        <ProductLink 
          product={product}
          className="block"
        >
          <div className="relative h-48 w-full bg-gray-100">
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 ease-in-out"
              style={{ 
                transform: isHovered ? 'scale(1.03)' : 'scale(1)', 
                opacity: product.imageUrl ? 1 : 0.5 
              }}
            />
          </div>
          
          <CardHeader className="p-4 pb-0">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg font-medium line-clamp-1">{product.name}</CardTitle>
              {!simpleCard && showPrice && product.price && (
                <Badge variant="secondary" className="ml-2 shrink-0">
                  ${product.price}
                </Badge>
              )}
            </div>
            
            {!simpleCard && (
              <div className="flex flex-wrap gap-1 mt-2">
                <Badge variant="outline" className="flex items-center text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {product.category}
                </Badge>
              </div>
            )}
          </CardHeader>
        </ProductLink>
        
        <CardContent className={`p-4 ${simpleCard ? 'pt-0' : 'pt-2'}`}>
          {!simpleCard && (
            <p className="text-muted-foreground text-sm line-clamp-2">
              {product.description || 'No description available'}
            </p>
          )}
        </CardContent>
        
        {!simpleCard && (
          <CardFooter className="p-4 pt-0 flex justify-between items-center">
            {showVotes && (
              <ProductVoteWrapper product={{ id: product.id, name: product.name }}>
                {() => (
                  <GlobalVoteButtons product={{ id: product.id, name: product.name }} />
                )}
              </ProductVoteWrapper>
            )}
            
            <div className="flex gap-2">
              {onTest && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onTest(product);
                  }}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Test
                </Button>
              )}
              
              <Button
                size="sm"
                variant="default"
                className="h-8 px-2 text-xs"
                onClick={handleViewProduct}
              >
                <ArrowUpRight className="h-3 w-3 mr-1" />
                View
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
} 