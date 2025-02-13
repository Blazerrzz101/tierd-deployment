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
import { getProduct } from "@/lib/supabase/server"

export default function ProductPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [threads, setThreads] = useState<Thread[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const { user } = useAuth()
  const supabase = getSupabaseClient()

  useEffect(() => {
    async function fetchProductAndThreads() {
      try {
        // Fetch product details
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('url_slug', params.slug)
          .single()

        if (productError) throw productError
        setProduct(productData)

        // Fetch threads for this product
        const { data: threadData, error: threadError } = await supabase
          .from('threads')
          .select(`
            *,
            user:users(username, avatar_url),
            products:thread_products(products(*))
          `)
          .eq('products.thread_products.product_id', productData.id)
          .order('created_at', { ascending: false })

        if (threadError) throw threadError

        if (threadData) {
          const transformedThreads = threadData.map(thread => ({
            ...thread,
            user: {
              ...thread.user[0],
              avatar_url: thread.user[0]?.avatar_url || undefined
            },
            products: thread.products.map(p => p.products)
          }))
          setThreads(transformedThreads)
        }
      } catch (error) {
        console.error('Error fetching product and threads:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.slug) {
      fetchProductAndThreads()
    }
  }, [params.slug, supabase])

  const handleCreateClick = () => {
    if (!user) {
      window.location.href = '/auth/sign-in'
      return
    }
    setShowCreateDialog(true)
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="space-y-4">
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
          <div className="h-40 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <p className="mt-2 text-muted-foreground">
            The product you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl px-6 py-12">
      {/* Product Details */}
      <ProductDetails product={product} />

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

        <div className="space-y-6">
          {threads.map(thread => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
          {threads.length === 0 && (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <h3 className="text-xl font-semibold">No discussions yet</h3>
              <p className="mt-2 text-muted-foreground">
                Be the first to start a discussion about {product.name}
              </p>
              <Button 
                onClick={handleCreateClick}
                variant="outline" 
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Thread
              </Button>
            </div>
          )}
        </div>

        <CreateThreadDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          defaultProduct={product}
        />
      </div>

      {/* Related Products */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-8">Related Products</h2>
        <RelatedProducts 
          categoryId={product.category}
          currentProductId={product.id}
        />
      </div>

      {/* Product Reviews */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-8">Reviews</h2>
        <ProductReviews productId={product.id} />
      </div>
    </div>
  )
} 