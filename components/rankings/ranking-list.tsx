"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { RankingCard } from "./ranking-card"
import { Product } from "@/types/product"
import { supabase } from "@/lib/supabase/client"
import { CATEGORY_IDS } from "@/lib/constants"

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
    async function fetchProducts() {
      try {
        console.log('Fetching products for category:', categoryId)
        setIsLoading(true)
        setError(null)

        let baseQuery = supabase
          .from('products')
          .select('*', { count: 'exact' })

        // Apply category filter if specified and valid
        if (categoryId && categoryId !== 'all') {
          baseQuery = baseQuery.eq('category', categoryId)
        }

        // Apply search filter if specified
        if (searchQuery) {
          baseQuery = baseQuery.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        }

        // Get the products with proper ordering
        const { data, error: queryError, count } = await baseQuery
          .order('votes', { ascending: false })
          .limit(50)

        if (queryError) {
          console.error('Database error:', queryError)
          setError(queryError.message)
          return
        }

        console.log(`Found ${count} products in category ${categoryId}`)
        console.log('Raw products data:', data)

        if (!data || data.length === 0) {
          setProducts([])
          return
        }

        const transformedProducts = data.map((product, index) => ({
          id: String(product.id),
          name: String(product.name || 'Unnamed Product'),
          description: product.description || '',
          category: product.category || '',
          price: product.price || 0,
          image_url: product.image_url || null,
          votes: product.votes || 0,
          rank: index + 1, // Set rank based on the sorted order
          specs: product.specs || {},
          userVote: product.user_vote || null,
          url_slug: product.url_slug || '',
          created_at: product.created_at || new Date().toISOString(),
          updated_at: product.updated_at || new Date().toISOString()
        }))

        setProducts(transformedProducts)
      } catch (err) {
        console.error('Error fetching products:', err)
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [categoryId, searchQuery])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <div>Error loading products:</div>
        <div className="text-sm">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-md text-sm"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {searchQuery 
          ? `No products found matching "${searchQuery}"`
          : 'No products found in this category.'
        }
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-4">
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