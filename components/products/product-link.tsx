"use client"

import Link from "next/link"
import { ReactNode } from "react"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { findProductById, getValidProductSlug, createProductUrl } from "@/utils/product-utils"

export interface ProductLinkProps {
  href?: string
  productId?: string
  productSlug?: string
  product?: any // Full product object
  children: ReactNode
  className?: string
  prefetch?: boolean
}

/**
 * Enhanced product link component that handles undefined slugs and provides URL preview
 */
export function ProductLink({ 
  href, 
  productId, 
  productSlug,
  product,
  children, 
  className = "",
  prefetch = false
}: ProductLinkProps) {
  // Determine the href to use, with fallbacks
  let finalHref: string | null = href || null;
  
  // If a full product object is provided, use it to generate the URL
  if (!finalHref && product) {
    finalHref = createProductUrl(product);
  }
  
  // If no href is provided but productSlug is, use that
  if (!finalHref && productSlug) {
    finalHref = `/products/${productSlug}`;
  }
  
  // If no href or productSlug, but productId is provided, use that
  if (!finalHref && productId) {
    // Try to find the product by ID to get a valid slug
    const foundProduct = findProductById(productId);
    if (foundProduct) {
      const validSlug = getValidProductSlug(foundProduct);
      finalHref = validSlug ? `/products/${validSlug}` : `/products/${productId}`;
    } else {
      finalHref = `/products/${productId}`;
    }
  }
  
  // Guard against undefined or empty hrefs
  if (!finalHref || finalHref.includes("undefined")) {
    console.warn('ProductLink received invalid href:', finalHref);
    // Just render a span instead of a link
    return <span className={className}>{children}</span>
  }

  // Remove any duplicate slashes and ensure proper format
  const formattedHref = finalHref
    .replace(/\/+/g, '/') // Replace multiple slashes with single slash
    .replace(/^\/products\/products\//, '/products/') // Fix duplicate /products/ prefix
  
  // Get the full URL for the tooltip
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const fullUrl = `${baseUrl}${formattedHref}`

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link 
            href={formattedHref} 
            className={className} 
            prefetch={prefetch}
          >
            {children}
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{fullUrl}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}