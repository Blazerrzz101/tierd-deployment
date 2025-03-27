"use client"

import { Product } from "@/types/product"
import { UnifiedProductDetail } from "./unified-product-detail"

interface ProductDetailLayoutProps {
  product: Product;
}

/**
 * ProductDetailLayout - A wrapper around UnifiedProductDetail to ensure consistent layout
 * This component exists for backward compatibility with existing code
 */
export function ProductDetailLayout({ product }: ProductDetailLayoutProps) {
  // Forward to UnifiedProductDetail for consistent UI
  return <UnifiedProductDetail product={product} />
}