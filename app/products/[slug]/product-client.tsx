"use client"

import { Product } from "@/types/product"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/lib/supabase/database.types"
import { useQuery } from "@tanstack/react-query"
import { ProductDetailLayout } from "@/components/products/product-detail-layout"
import { ErrorBoundary } from "react-error-boundary"
import { ErrorFallback } from "@/components/error-fallback"
import { FC } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { products as localProducts } from "@/lib/data"

function slugToName(url_slug: string): string {
  // Convert url_slug like "pulsar-x2" to "Pulsar X2"
  return url_slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function fetchProduct(supabase: ReturnType<typeof createClientComponentClient<Database>>, url_slug: string) {
  console.log('Attempting to fetch product with url_slug:', url_slug)
  
  try {
    // First try to find the product by querying the product_rankings view
    const { data: products, error } = await supabase
      .from('product_rankings')
      .select('*')
      .limit(50)

    if (error) {
      console.error('Error fetching products:', error)
      throw new Error('Failed to fetch products')
    }

    // Find the product by matching the generated slug
    const product = products?.find(p => generateSlug(p.name || '') === url_slug)

    if (!product) {
      console.error('No product found with slug:', url_slug)
      throw new Error('Product not found')
    }

    // Transform the database product to match our Product type
    const transformedProduct: Product = {
      id: String(product.id),
      name: String(product.name),
      description: product.description || '',
      category: product.category || '',
      price: product.price || 0,
      imageUrl: product.image_url || '/placeholder.png',
      votes: (product.upvotes || 0) - (product.downvotes || 0),
      rank: product.rank || 0,
      specs: {},
      userVote: null,
      url_slug: generateSlug(product.name || '')
    }

    return transformedProduct
  } catch (error) {
    console.error('Error in fetchProduct:', error)
    throw error
  }
}

function useProduct(url_slug: string) {
  const supabase = createClientComponentClient<Database>()

  return useQuery({
    queryKey: ['product', url_slug],
    queryFn: () => fetchProduct(supabase, url_slug),
    retry: 1, // Only retry once to avoid too many retries on 404s
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  })
}

interface ProductContentProps {
  url_slug: string;
}

const ProductContent: FC<ProductContentProps> = ({ url_slug }) => {
  const { data: product, error, isLoading } = useProduct(url_slug)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto"></div>
          <p className="mt-4">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    console.error('Error in ProductContent:', error)
    throw error
  }

  if (!product) {
    console.error('No product data available')
    throw new Error('Product not found')
  }

  return <ProductDetailLayout product={product} />
}

interface ProductClientProps {
  url_slug: string;
}

export const ProductClient: FC<ProductClientProps> = ({ url_slug }) => {
  if (!url_slug) return null

  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => window.location.reload()}
      >
        <ProductContent url_slug={url_slug} />
      </ErrorBoundary>
    </QueryClientProvider>
  )
}

export default ProductClient 