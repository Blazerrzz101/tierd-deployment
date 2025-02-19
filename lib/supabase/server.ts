import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
}

// Create service role client for server-side access
export const supabaseServer = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export type Product = Database['public']['Tables']['products']['Row']

export async function getProduct(slug: string) {
  try {
    console.log('Fetching product with slug:', slug)
    
    const { data, error } = await supabaseServer
      .from('products')
      .select()
      .eq('url_slug', slug)
      .single()

    if (error) {
      console.error('Error fetching product:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return null
    }

    if (!data) {
      console.log('No product found with slug:', slug)
      return null
    }

    const product = data as Product

    console.log('Successfully fetched product:', {
      id: product.id,
      name: product.name,
      category: product.category
    })

    return {
      ...product,
      specs: product.specifications,
      rating: (product.specifications as any)?.rating ?? 0,
      review_count: (product.specifications as any)?.review_count ?? 0,
      stock_status: (product.specifications as any)?.stock_status ?? "in_stock"
    }
  } catch (error) {
    console.error('Unexpected error fetching product:', error)
    return null
  }
}