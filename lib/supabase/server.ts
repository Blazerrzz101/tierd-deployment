import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
}

// Create anon client for public access
export const supabaseAnon = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
)

// Create service role client for admin access
export const supabaseServer = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
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
    
    // First try with anon role
    const { data: anonData, error: anonError } = await supabaseAnon
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

    if (!anonError && anonData) {
      console.log('Successfully fetched product with anon role:', {
        id: anonData.id,
        name: anonData.name,
        category: anonData.category
      })

      return {
        ...anonData,
        specs: anonData.details,
        rating: anonData.metadata?.rating ?? 0,
        review_count: anonData.metadata?.review_count ?? 0,
        stock_status: anonData.metadata?.stock_status ?? "in_stock"
      }
    }

    console.error('Error fetching product with anon role:', {
      error: anonError,
      message: anonError?.message,
      details: anonError?.details,
      hint: anonError?.hint
    })
    
    // Try again with service role as fallback
    const { data: serviceData, error: serviceError } = await supabaseServer
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

    if (serviceError) {
      console.error('Error fetching product with service role:', {
        error: serviceError,
        message: serviceError.message,
        details: serviceError.details,
        hint: serviceError.hint
      })
      return null
    }

    if (!serviceData) {
      console.log('No product found with slug:', slug)
      return null
    }

    console.log('Successfully fetched product with service role:', {
      id: serviceData.id,
      name: serviceData.name,
      category: serviceData.category
    })

    return {
      ...serviceData,
      specs: serviceData.details,
      rating: serviceData.metadata?.rating ?? 0,
      review_count: serviceData.metadata?.review_count ?? 0,
      stock_status: serviceData.metadata?.stock_status ?? "in_stock"
    }
  } catch (error) {
    console.error('Unexpected error fetching product:', error)
    return null
  }
}