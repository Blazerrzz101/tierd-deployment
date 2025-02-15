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
  const [product, setProduct] = useState<Product | null>(null)
  const [threads, setThreads] = useState<Thread[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const { user } = useAuth()
  const supabase = getSupabaseClient()
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
          const transformedProduct: Product = {
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
            relatedProducts: productData[0].related_products,
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
      <ProductDetails product={product} />

      {/* Related Products */}
      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8">Similar Products</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {product.relatedProducts.map((relatedProduct) => (
              <ProductCard 
                key={relatedProduct.id} 
                product={{
                  id: relatedProduct.id,
                  name: relatedProduct.name,
                  description: '',
                  category: relatedProduct.category,
                  price: relatedProduct.price || 0,
                  image_url: '/placeholder-product.png',
                  url_slug: relatedProduct.url_slug,
                  votes: relatedProduct.votes,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  userVote: null,
                  rating: 0,
                  review_count: 0,
                  stock_status: 'in_stock',
                  details: {
                    stock_quantity: 0
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}

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
    </div>
  )
} 