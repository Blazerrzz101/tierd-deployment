"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { RankingCard } from "./ranking-card"
import { Product } from "@/types/product"
import { supabase } from "@/lib/supabase/client"
import { CATEGORY_IDS } from "@/lib/constants"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

// Base64 encoded SVG placeholder
const PLACEHOLDER_IMAGE = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiMyMDIwMjAiLz48cGF0aCBkPSJNMTgyIDIwMkMyMDAgMTY2IDIxNSAxNDUgMjM1IDE0NUMyNTUgMTQ1IDI2NSAxNjYgMjcwIDIwMkMzMDAgMTY2IDMxNSAxNDUgMzM1IDE0NUMzNTUgMTQ1IDM2NSAxNjYgMzcwIDIwMiIgc3Ryb2tlPSIjNDA0MDQwIiBzdHJva2Utd2lkdGg9IjIwIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4="

type CategoryId = typeof CATEGORY_IDS[keyof typeof CATEGORY_IDS] | 'all'

interface RankingListProps {
  categoryId: CategoryId
}

interface DatabaseProduct {
  id: string
  name: string
  description: string
  category: string
  price: number
  image_url: string
}

// Helper function to generate URL-safe slugs
function generateSlug(name: string | null | undefined): string {
  if (!name) return ''
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function RankingList({ categoryId }: RankingListProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('search')

  useEffect(() => {
    let isMounted = true
    
    async function fetchProducts() {
      try {
        setIsLoading(true)
        setError(null)

        const { data, error: queryError } = await supabase
          .rpc('get_product_rankings', {
            p_category: categoryId === 'all' ? null : categoryId
          })

        if (queryError) throw queryError

        if (isMounted) {
          let filteredProducts = data || []
          
          // Apply search filter if needed
          if (searchQuery) {
            const searchLower = searchQuery.toLowerCase()
            filteredProducts = filteredProducts.filter((p: Product) => 
              p.name.toLowerCase().includes(searchLower) ||
              (p.description && p.description.toLowerCase().includes(searchLower))
            )
          }

          setProducts(filteredProducts)
        }
      } catch (err) {
        console.error('Error fetching products:', err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An unexpected error occurred')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchProducts()
    return () => { isMounted = false }
  }, [categoryId, searchQuery])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">
          Loading rankings...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
        <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Rankings</h3>
        <p className="text-destructive/80 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="text-sm font-medium text-destructive hover:text-destructive/80 underline underline-offset-4"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium mb-2">No Products Found</p>
        <p className="text-muted-foreground">
          {searchQuery 
            ? `No products found matching "${searchQuery}"`
            : 'No products found in this category.'
          }
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {products.map((product, index) => (
        <RankingCard
          key={product.id}
          rank={index + 1}
          product={product}
        />
      ))}
    </div>
  )
}