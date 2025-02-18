"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Product } from "@/types/product"
import { Thread } from "@/types/thread"
import { ThreadCard } from "@/components/threads/thread-card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateThreadDialog } from "@/components/threads/create-thread-dialog"
import { useAuth } from "@/hooks/use-auth"
import { ProductDetails } from "@/components/products/product-details"
import { RelatedProducts } from "@/components/products/related-products"
import { ProductReviews } from "@/components/products/product-reviews"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { NotFound } from "@/components/not-found"
import Link from "next/link"
import { ProductCard } from "@/components/products/product-card"
import Image from 'next/image'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'
import { useProducts } from '@/hooks/useProducts'
import { ProductReviewForm } from '@/components/products/ProductReviewForm'
import { ProductReviewList } from '@/components/products/ProductReviewList'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

type ProductRanking = Database['public']['Views']['product_rankings']['Row']
type Review = Database['public']['Tables']['reviews']['Row']

interface ProductDetailsResponse {
  id: string
  name: string
  description: string | null
  category: string
  price: number | null
  image_url: string | null
  specifications: Record<string, unknown>
  votes: number
  rank: number
  url_slug: string
  created_at: string
  updated_at: string
  related_products: Array<{
    id: string
    name: string
    url_slug: string
    price: number | null
    votes: number
  }>
}

export default function ProductPage() {
  const params = useParams()
  const { toast } = useToast()
  const supabase = createClientComponentClient<Database>()
  const { vote } = useProducts()
  const [product, setProduct] = useState<ProductRanking | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [threads, setThreads] = useState<Thread[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    
    async function fetchProductAndThreads() {
      try {
        setIsLoading(true)
        setError(null)

        // Use the get_product_details function
        const { data: productData, error: productError } = await supabase
          .rpc('get_product_details', { p_slug: params.slug })

        if (productError) {
          console.error('Error fetching product:', productError)
          if (isMounted) {
            setError('Product not found')
            setIsLoading(false)
            setProduct(null)
          }
          return
        }
        
        if (!productData || productData.length === 0) {
          if (isMounted) {
            setError('Product not found')
            setIsLoading(false)
            setProduct(null)
          }
          return
        }

        if (isMounted) {
          // Transform the product data
          const transformedProduct: ProductRanking = {
            id: productData[0].id,
            name: productData[0].name,
            description: productData[0].description,
            category: productData[0].category,
            price: productData[0].price,
            image_url: productData[0].image_url || '/placeholder-product.png',
            specifications: productData[0].specifications,
            votes: productData[0].votes,
            rank: productData[0].rank,
            url_slug: productData[0].url_slug,
            created_at: productData[0].created_at,
            updated_at: productData[0].updated_at,
            related_products: productData[0].related_products,
            upvotes: productData[0].upvotes,
            downvotes: productData[0].downvotes,
            userVote: productData[0].user_vote,
            rating: productData[0].rating || 0,
            review_count: productData[0].review_count || 0,
            stock_status: productData[0].stock_status || 'in_stock',
            details: {
              ...productData[0].specifications,
              stock_quantity: productData[0].specifications?.stock_quantity || 0
            }
          }
          
          setProduct(transformedProduct)

          // Fetch threads for this product
          const { data: threadData, error: threadError } = await supabase
            .from('threads')
            .select(`
              *,
              user:users(username, avatar_url),
              products:thread_products(products(*))
            `)
            .eq('products.thread_products.product_id', productData[0].id)
            .order('created_at', { ascending: false })

          if (threadError) {
            console.error('Error fetching threads:', threadError)
            if (isMounted) {
              setThreads([])
            }
          } else if (threadData && isMounted) {
            const transformedThreads = threadData.map((thread: any) => ({
              ...thread,
              user: {
                ...thread.user[0],
                avatar_url: thread.user[0]?.avatar_url || undefined
              },
              products: thread.products?.map((p: any) => p.products) || []
            }))
            setThreads(transformedThreads)
          }

          // Fetch reviews
          const { data: reviewsData, error: reviewsError } = await supabase
            .from('reviews')
            .select('*')
            .eq('product_id', productData[0].id)
            .order('created_at', { ascending: false })

          if (reviewsError) throw reviewsError
          setReviews(reviewsData)

          // Fetch user's vote
          const {
            data: { session },
          } = await supabase.auth.getSession()

          if (session) {
            const { data: voteData } = await supabase
              .from('votes')
              .select('vote_type')
              .eq('product_id', productData[0].id)
              .eq('user_id', session.user.id)
              .single()

            setUserVote(voteData?.vote_type as 'upvote' | 'downvote' | null)
          }
        }
      } catch (error) {
        console.error('Error fetching product and threads:', error)
        if (isMounted) {
          setError('An error occurred while loading the product')
          setThreads([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    if (params.slug) {
      fetchProductAndThreads()
    } else {
      setIsLoading(false)
      setError('Invalid product URL')
    }
    
    return () => { isMounted = false }
  }, [params.slug, supabase])

  const handleCreateClick = () => {
    if (!user) {
      window.location.href = '/auth/sign-in?redirect=' + encodeURIComponent(window.location.pathname)
      return
    }
    setShowCreateDialog(true)
  }

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!product) return

    try {
      await vote(product.id, voteType)
      
      // Refresh product data
      const { data } = await supabase
        .from('product_rankings')
        .select('*')
        .eq('id', product.id)
        .single()

      if (data) {
        setProduct(data)
        setUserVote(voteType)
      }
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  const handleReviewSubmit = async (data: {
    rating: number
    title: string
    content: string
    pros?: string[]
    cons?: string[]
  }) => {
    if (!product) return

    try {
      setIsSubmittingReview(true)
      const { error } = await supabase.from('reviews').insert({
        product_id: product.id,
        ...data,
      })

      if (error) throw error

      // Refresh reviews
      const { data: newReviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false })

      if (reviewsError) throw reviewsError
      setReviews(newReviews)

      toast({
        title: 'Success',
        description: 'Your review has been submitted.',
      })
    } catch (error) {
      console.error('Error submitting review:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmittingReview(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <LoadingSpinner />
        <p className="mt-4 text-center text-muted-foreground">Loading product details...</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h1 className="text-6xl font-bold mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-6">
            {error || "Product not found"}
          </h2>
          <p className="text-white/70 mb-8 max-w-md">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/products">
            <Button className="mt-4" variant="outline">
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl px-6 py-12">
      {/* Product Details */}
      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-lg">
          <Image
            src={product.image_url || '/placeholder.png'}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              {product.description}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Category</span>
              <span className="text-sm">{product.category}</span>
            </div>
            {product.price && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Price</span>
                <span className="text-lg font-bold">
                  ${product.price.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Rank</span>
              <span className="text-sm">#{product.rank} in {product.category}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleVote('upvote')}
              className={cn(
                'flex-1 gap-2',
                userVote === 'upvote' && 'bg-green-100 hover:bg-green-200'
              )}
            >
              <ThumbsUp className="h-5 w-5" />
              <span>{product.upvotes}</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleVote('downvote')}
              className={cn(
                'flex-1 gap-2',
                userVote === 'downvote' && 'bg-red-100 hover:bg-red-200'
              )}
            >
              <ThumbsDown className="h-5 w-5" />
              <span>{product.downvotes}</span>
            </Button>
          </div>

          {product.specifications && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Specifications</h2>
              <div className="rounded-lg border p-4">
                {Object.entries(product.specifications as Record<string, unknown>).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between border-b py-2 last:border-0"
                    >
                      <span className="text-sm font-medium">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-sm">{String(value)}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Discussions Section */}
      <div className="mt-16">
        <div className="mb-8 flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Discussions</h2>
            <p className="mt-2 text-lg text-muted-foreground">
              Join the conversation about {product.name}
            </p>
          </div>
          <Button 
            onClick={handleCreateClick}
            className="mt-4 sm:mt-0"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            New Thread
          </Button>
        </div>

        {threads.length > 0 ? (
          <div className="space-y-6">
            {threads.map((thread) => (
              <ThreadCard key={thread.id} thread={thread} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <h3 className="text-lg font-semibold">No discussions yet</h3>
            <p className="mt-2 text-muted-foreground">
              Be the first to start a discussion about {product.name}
            </p>
            <Button
              onClick={handleCreateClick}
              className="mt-4"
              variant="outline"
            >
              Create Thread
            </Button>
          </div>
        )}
      </div>

      {showCreateDialog && (
        <CreateThreadDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          defaultProduct={product}
        />
      )}

      <div className="mt-12 space-y-8">
        <div>
          <h2 className="text-2xl font-bold">Reviews</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Share your experience with this product
          </p>
        </div>

        <ProductReviewForm
          onSubmit={handleReviewSubmit}
          isSubmitting={isSubmittingReview}
        />

        <div className="mt-8">
          <h3 className="mb-4 text-lg font-semibold">
            Customer Reviews ({reviews.length})
          </h3>
          <ProductReviewList reviews={reviews} />
        </div>
      </div>
    </div>
  )
} 