"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Product } from "@/types/product"
import { supabase } from "@/lib/supabase/client"
import { CATEGORY_IDS } from "@/lib/constants"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { normalizeProduct } from "@/lib/utils"
import { ProductCard } from "@/components/products/product-card"
import { useDebounce } from "@/hooks/use-debounce"

// Base64 encoded SVG placeholder
const PLACEHOLDER_IMAGE = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiMyMDIwMjAiLz48cGF0aCBkPSJNMTgyIDIwMkMyMDAgMTY2IDIxNSAxNDUgMjM1IDE0NUMyNTUgMTQ1IDI2NSAxNjYgMjcwIDIwMkMzMDAgMTY2IDMxNSAxNDUgMzM1IDE0NUMzNTUgMTQ1IDM2NSAxNjYgMzcwIDIwMiIgc3Ryb2tlPSIjNDA0MDQwIiBzdHJva2Utd2lkdGg9IjIwIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4="

type CategoryId = typeof CATEGORY_IDS[keyof typeof CATEGORY_IDS]

interface RankingListProps {
  selectedCategory: CategoryId | "all"
  searchQuery?: string
}

// Helper function to convert frontend category to database format
function getDatabaseCategory(categoryId: CategoryId | "all" | undefined): string | null {
  if (!categoryId || categoryId === "all") return null;
  
  const categoryMap: Record<CategoryId, string> = {
    [CATEGORY_IDS.MICE]: "gaming-mice",
    [CATEGORY_IDS.KEYBOARDS]: "gaming-keyboards",
    [CATEGORY_IDS.HEADSETS]: "gaming-headsets",
    [CATEGORY_IDS.MONITORS]: "gaming-monitors",
    [CATEGORY_IDS.CHAIRS]: "gaming-chairs"
  };
  
  const databaseCategory = categoryMap[categoryId as CategoryId] || null;
  console.log(`Converting category: ${categoryId} to database category: ${databaseCategory}`);
  return databaseCategory;
}

export function RankingList({ selectedCategory = "all", searchQuery = "" }: RankingListProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const debouncedSearch = useDebounce(searchQuery, 300)

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        setError(null)
        
        const databaseCategory = getDatabaseCategory(selectedCategory)
        console.log(`Fetching products for category: ${databaseCategory}, selectedCategory: ${selectedCategory}`)
        
        let query = supabase.rpc('get_product_rankings', {
          p_category: databaseCategory
        })

        const { data, error } = await query

        if (error) {
          console.error("Error fetching products:", error)
          setError("Failed to fetch products")
          return
        }

        // Filter products by search query if provided
        let filteredProducts = data || []
        
        if (debouncedSearch) {
          const searchTerms = debouncedSearch.toLowerCase().split(' ')
          filteredProducts = filteredProducts.filter((product: Product) => {
            const searchableText = `${product.name} ${product.description} ${product.category}`.toLowerCase()
            return searchTerms.every(term => searchableText.includes(term))
          })
        }

        // Normalize all products
        const normalizedProducts = filteredProducts.map((product: Product) => normalizeProduct(product))
        
        // Sort products by rank and then by score
        normalizedProducts.sort((a: Product, b: Product) => {
          if (a.rank !== b.rank) {
            return (a.rank || 0) - (b.rank || 0)
          }
          return (b.score || 0) - (a.score || 0)
        })

        console.log(`Found ${normalizedProducts.length} products after filtering`)
        setProducts(normalizedProducts)
      } catch (err) {
        console.error("Error in fetchProducts:", err)
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [selectedCategory, debouncedSearch])

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">
          Loading {selectedCategory === "all" ? "all products" : selectedCategory}...
        </p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium mb-2">No Products Found</p>
        <p className="text-muted-foreground">
          {searchQuery 
            ? `No products found matching "${searchQuery}" in ${selectedCategory === "all" ? "any category" : selectedCategory}`
            : `No products found in ${selectedCategory === "all" ? "any category" : selectedCategory}`
          }
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}