import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
}

export const supabaseServer = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'x-supabase-role': 'service_role'
      }
    }
  }
)

export async function getProduct(slug: string) {
  try {
    console.log('Fetching product with slug:', slug)
    
    const { data, error } = await supabaseServer
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        category,
        image_url,
        url_slug,
        details,
        metadata,
        created_at,
        updated_at
      `)
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

    console.log('Successfully fetched product:', {
      id: data.id,
      name: data.name,
      category: data.category
    })

    return {
      ...data,
      specs: data.details,
      rating: data.metadata?.rating ?? 0,
      review_count: data.metadata?.review_count ?? 0,
      stock_status: data.metadata?.stock_status ?? "in_stock"
    }
  } catch (error) {
    console.error('Unexpected error fetching product:', error)
    return null
  }
}