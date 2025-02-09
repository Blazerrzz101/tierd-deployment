import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url: string
  url_slug: string
  specs: Record<string, any>
  rating: number
  review_count: number
  stock_status: "in_stock" | "low_stock" | "out_of_stock"
  created_at: string
  updated_at: string
}

export function useProduct(slug: string) {
  return useQuery<Product>({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          category,
          image_url,
          url_slug,
          specs,
          rating,
          review_count,
          stock_status,
          created_at,
          updated_at
        `)
        .eq('url_slug', slug)
        .single()

      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    retry: 2
  })
} 