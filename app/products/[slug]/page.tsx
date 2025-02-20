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
    // Normalize the slug to handle URL variations
    const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')

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
        total_votes
      `)
      .eq('url_slug', normalizedSlug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Try to find the product by name if slug doesn't match
        const { data: productByName, error: nameError } = await supabaseServer
          .from('product_rankings')
          .select('url_slug')
          .ilike('name', `%${slug.replace(/-/g, ' ')}%`)
          .limit(1)
          .single()

        if (!nameError && productByName) {
          return getProduct(productByName.url_slug)
        }
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
      imageUrl: product.image_url || '',
      votes: (product.upvotes || 0) - (product.downvotes || 0),
      rank: product.rank || 0,
      specs: product.specifications || {},
      userVote: null,
      url_slug: product.url_slug
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
          <div className="space-y-2">
            <p>An error occurred while loading the product. Please try again later.</p>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-2 text-xs overflow-auto">
                {error instanceof Error ? error.message : String(error)}
              </pre>
            )}
            <p className="text-sm text-muted-foreground">
              If you continue to see this error, please try:
              <ul className="list-disc list-inside mt-1">
                <li>Refreshing the page</li>
                <li>Clearing your browser cache</li>
                <li>Checking the URL for typos</li>
              </ul>
            </p>
          </div>
        </AlertDescription>
      </Alert>
    )
  }
} 