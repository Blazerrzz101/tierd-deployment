import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
import { ProductPage } from '@/components/products/product-page'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { Product } from '@/types/product'
import { ErrorBoundary } from '@/components/error-boundary'
import { ProductErrorFallback } from '@/components/products/product-error-fallback'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface PageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  try {
    const { data: products, error } = await supabaseServer
      .from('product_rankings')
      .select('url_slug')
      .order('rank', { ascending: true })
      .limit(20)

    if (error) {
      console.error('Error fetching static params:', error)
      return []
    }

    return (products || []).map((product) => ({
      slug: product.url_slug,
    }))
  } catch (error) {
    console.error('Error in generateStaticParams:', error)
    return []
  }
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const { data: product, error } = await supabaseServer
      .from('product_rankings')
      .select(`
        id,
        name,
        description,
        category,
        price,
        image_url,
        url_slug,
        specifications,
        upvotes,
        downvotes,
        rating,
        review_count,
        rank,
        score,
        total_votes,
        created_at,
        updated_at
      `)
      .eq('url_slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error fetching product:', error)
      throw error
    }

    if (!product) {
      return null
    }

    const transformedProduct: Product = {
      id: product.id,
      name: product.name,
      description: product.description || '',
      category: product.category,
      price: product.price || 0,
      image_url: product.image_url || '',
      url_slug: product.url_slug,
      specifications: product.specifications || {},
      upvotes: product.upvotes || 0,
      downvotes: product.downvotes || 0,
      total_votes: product.total_votes || 0,
      score: product.score || 0,
      rank: product.rank || 0,
      rating: product.rating || 0,
      review_count: product.review_count || 0,
      created_at: product.created_at || new Date().toISOString(),
      updated_at: product.updated_at || new Date().toISOString(),
      userVote: null
    }

    return transformedProduct
  } catch (error) {
    console.error('Error in getProduct:', error)
    throw error
  }
}

export default async function Page({ params }: PageProps) {
  try {
    const product = await getProduct(params.slug)

    if (!product) {
      return notFound()
    }

    return (
      <ErrorBoundary fallback={<ProductErrorFallback />}>
        <Suspense fallback={<LoadingSpinner />}>
          <ProductPage product={product} />
        </Suspense>
      </ErrorBoundary>
    )
  } catch (error) {
    console.error('Error in product page:', error)
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          An error occurred while loading the product. Please try again later.
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-2 text-xs">
              {error instanceof Error ? error.message : String(error)}
            </pre>
          )}
        </AlertDescription>
      </Alert>
    )
  }
} 