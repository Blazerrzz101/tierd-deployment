"use client"

import { useState, useEffect } from "react"
import { categories } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { ThumbsUp, ThumbsDown, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { VoteType } from "@/types/vote"
import { getSupabaseClient, testDatabaseConnection } from "@/lib/supabase/client"
import { Product } from "@/types/product"
import { VoteButtons } from "@/components/products/vote-buttons"
import { useVote } from "@/hooks/use-vote"

export function ProductRankings() {
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id)
  const [displayCount, setDisplayCount] = useState(5)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Fetch products for the selected category
  useEffect(() => {
    let isMounted = true
    let retryTimeout: NodeJS.Timeout
    
    async function fetchProducts() {
      try {
        setIsLoading(true)
        setError(null)

        // Test database connection first
        const isConnected = await testDatabaseConnection()
        if (!isConnected) {
          throw new Error('Unable to connect to local Supabase instance. Please ensure Supabase is running locally.')
        }

        const supabase = getSupabaseClient()
        console.log('Fetching products for category:', selectedCategory)
        
        const { data, error } = await supabase
          .rpc('get_product_rankings', {
            p_category: selectedCategory === 'all' ? null : selectedCategory
          })

        if (error) {
          console.error('RPC Error:', error)
          throw error
        }

        if (data && isMounted) {
          console.log('Fetched products:', data.length)
          setProducts(data)
          setRetryCount(0) // Reset retry count on success
        }
      } catch (err) {
        console.error('Error fetching products:', err)
        if (isMounted) {
          const isLocalhost = window.location.hostname === 'localhost'
          const errorMessage = isLocalhost
            ? 'Unable to fetch products. Please ensure your local Supabase instance is running and the database is properly seeded.'
            : err instanceof Error ? err.message : 'Failed to load products'
          
          setError(errorMessage)
          
          // Implement exponential backoff for retries
          if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
            retryTimeout = setTimeout(() => {
              setRetryCount(prev => prev + 1)
              fetchProducts()
            }, delay)
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchProducts()
    
    return () => {
      isMounted = false
      if (retryTimeout) {
        clearTimeout(retryTimeout)
      }
    }
  }, [selectedCategory, retryCount])

  const displayedProducts = products
    .slice(0, displayCount)
    .sort((a, b) => (b.votes || 0) - (a.votes || 0))

  const hasMore = displayCount < products.length

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">Loading rankings...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
        <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Rankings</h3>
        <p className="text-destructive/80 mb-4">{error}</p>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Attempt {retryCount + 1} of 3
          </p>
          <button 
            onClick={() => {
              setRetryCount(0)
              setError(null)
            }}
            className="text-sm font-medium text-destructive hover:text-destructive/80 underline underline-offset-4"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Category Navigation */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-4 pb-4">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant="outline"
              size="lg"
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "min-w-[120px] rounded-full border-2",
                selectedCategory === category.id && 
                "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {category.name}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Product Rankings */}
      <div className="space-y-4">
        {displayedProducts.map((product, index) => (
          <ProductRankingCard 
            key={product.id} 
            product={product}
            rank={index + 1}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setDisplayCount(prev => prev + 5)}
          >
            Show More
          </Button>
        </div>
      )}
    </div>
  )
}

function ProductRankingCard({ product, rank }: { product: Product, rank: number }) {
  const { vote } = useVote(product)

  return (
    <div className="group relative flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10">
      {/* Rank */}
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold",
        rank === 1 && "bg-yellow-500/20 text-yellow-500",
        rank === 2 && "bg-gray-500/20 text-gray-400",
        rank === 3 && "bg-orange-900/20 text-orange-700",
        rank > 3 && "bg-white/10 text-white/50"
      )}>
        #{rank}
      </div>

      {/* Product Image */}
      <div className="relative aspect-square w-16 overflow-hidden rounded-lg bg-zinc-100">
        <Image
          src={product.image_url || "/images/products/placeholder.svg"}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 64px, 64px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            const img = e.target as HTMLImageElement
            img.src = "/images/products/placeholder.svg"
          }}
        />
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col gap-1">
        <Link 
          href={`/products/${product.url_slug}`}
          className="text-lg font-medium hover:underline"
        >
          {product.name}
        </Link>
        <div className="flex items-center gap-2 text-sm text-white/60">
          <span className="capitalize">{product.category.replace('-', ' ')}</span>
          <span>•</span>
          <span>${product.price?.toFixed(2)}</span>
          {(product.rating ?? 0) > 0 && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span>{(product.rating ?? 0).toFixed(1)}</span>
                <span>({product.review_count ?? 0})</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Vote Buttons */}
      <VoteButtons 
        product={product}
        onVote={vote}
        className="shrink-0"
      />
    </div>
  )
}