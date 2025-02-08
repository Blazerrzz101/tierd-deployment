"use client"

import { useState, useEffect } from "react"
import { RankingCard } from "./ranking-card"
import { Product } from "@/types/product"
import { supabase } from "@/lib/supabase/client"

// Base64 encoded SVG placeholder
const PLACEHOLDER_IMAGE = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiMyMDIwMjAiLz48cGF0aCBkPSJNMTgyIDIwMkMyMDAgMTY2IDIxNSAxNDUgMjM1IDE0NUMyNTUgMTQ1IDI2NSAxNjYgMjcwIDIwMkMzMDAgMTY2IDMxNSAxNDUgMzM1IDE0NUMzNTUgMTQ1IDM2NSAxNjYgMzcwIDIwMiIgc3Ryb2tlPSIjNDA0MDQwIiBzdHJva2Utd2lkdGg9IjIwIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4="

interface RankingListProps {
  categoryId: string
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

  useEffect(() => {
    async function fetchProducts() {
      try {
        console.log('Fetching products for category:', categoryId)
        setIsLoading(true)
        setError(null)

        // Fetch products from the rankings view for the category
        const { data: productsData, error: productsError } = await supabase
          .from('product_rankings')
          .select('*')
          .eq('category', categoryId)
          .order('rank')
          .limit(5)

        if (productsError) {
          console.error('Error fetching products:', productsError)
          throw productsError
        }

        // Transform products into client-safe format
        const transformedProducts = productsData
          .filter(product => product.id && product.name) // Filter out any products with null id or name
          .map(product => {
            // Create a plain object with only the fields needed by the client
            const clientProduct = {
              id: String(product.id),
              name: String(product.name),
              description: product.description || '',
              category: product.category || '',
              price: product.price || 0,
              imageUrl: product.image_url || PLACEHOLDER_IMAGE,
              votes: (product.upvotes || 0) - (product.downvotes || 0),
              rank: product.rank || 0,
              specs: {},
              userVote: null,
              url_slug: generateSlug(product.name)
            } satisfies Product

            return clientProduct
          })

        console.log('Transformed products:', transformedProducts.map(p => ({
          id: p.id,
          name: p.name,
          votes: p.votes,
          rank: p.rank,
          url_slug: p.url_slug
        })))

        setProducts(transformedProducts)
      } catch (err: any) {
        console.error('Unexpected error:', err)
        setError(`An unexpected error occurred: ${err.message}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [categoryId])

  if (isLoading) {
    return <div className="text-center py-8">Loading products...</div>
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <div>Error loading products:</div>
        <div className="text-sm">{error}</div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No products found in this category.
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