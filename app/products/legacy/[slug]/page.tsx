"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { findProductById, getValidProductSlug, createProductUrl } from "@/utils/product-utils"

/**
 * This page handles requests for old product URLs that used IDs instead of slugs.
 * Now moved to a separate route to avoid Next.js routing conflicts.
 * It redirects them to the new slug-based URLs for better SEO and readability.
 */
export default function ProductLegacyRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string
  
  useEffect(() => {
    if (!slug) return
    
    // First, try to find by ID for backward compatibility
    const productById = findProductById(slug)
    
    if (productById) {
      // We found the product by ID, redirect to the slug-based URL
      const validSlug = getValidProductSlug(productById)
      const newUrl = `/products/${validSlug}`
      
      if (validSlug !== slug) {
        console.log(`Redirecting from legacy ID URL: /products/legacy/${slug} to new URL: ${newUrl}`)
        router.replace(newUrl)
      }
    } else {
      // If product not found by ID, redirect to main products page
      console.log(`Product with ID ${slug} not found, redirecting to products page`)
      router.replace('/products')
    }
  }, [slug, router])
  
  // Show loading state while redirecting
  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Redirecting to product...</h1>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <Skeleton className="w-full aspect-square rounded-xl" />
        </div>
        <div className="lg:col-span-7">
          <Skeleton className="w-full h-10 mb-4" />
          <Skeleton className="w-3/4 h-4 mb-2" />
          <Skeleton className="w-1/2 h-4 mb-6" />
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Skeleton className="w-full h-20" />
            <Skeleton className="w-full h-20" />
          </div>
          <Skeleton className="w-full h-40" />
        </div>
      </div>
    </div>
  )
} 