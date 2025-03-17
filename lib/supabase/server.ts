import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
// Conditionally import cookies to prevent build errors
let cookies: any;
try {
  cookies = require('next/headers').cookies;
} catch (error) {
  cookies = () => ({
    get: () => null
  });
  console.warn('Failed to import cookies from next/headers, using fallback');
}
import { Product } from '@/types/product'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

// Modified to not require SUPABASE_SERVICE_ROLE_KEY
// if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
//   throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
// }

// Create a Supabase client specifically for server components and API routes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Add log to debug
console.log('Creating Supabase server client with URL:', supabaseUrl);

export const supabaseServer = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: false,
    },
  }
);

// Create a Supabase client for server components
export function createServerSupabaseClient() {
  const cookieStore = cookies()
  
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
        storageKey: undefined,
        storage: {
          getItem: (key: string) => {
            const cookie = cookieStore.get(key)
            return cookie?.value ?? null
          },
          setItem: () => {},
          removeItem: () => {}
        }
      }
    }
  )
}

export async function getProduct(slug: string): Promise<Product | null> {
  try {
    console.log('Fetching product with slug:', slug)
    
    // Get the basic product data
    const { data: productData, error: productError } = await supabaseServer
      .from('products')
      .select('*')
      .eq('url_slug', slug)
      .single()

    console.log('Product query result:', { 
      productData: productData ? {
        id: productData.id,
        name: productData.name,
        category: productData.category,
        url_slug: productData.url_slug
      } : null, 
      error: productError?.message,
      errorDetails: productError?.details
    })

    if (productError) {
      console.error('Error fetching product:', productError)
      return null
    }

    if (!productData) {
      console.error('No product found with slug:', slug)
      return null
    }

    // Get rankings data
    const { data: rankingsData, error: rankingsError } = await supabaseServer
      .from('product_rankings')
      .select('*')
      .eq('id', productData.id)
      .single()

    console.log('Rankings query result:', { 
      rankingsData: rankingsData ? {
        id: rankingsData.id,
        upvotes: rankingsData.upvotes,
        downvotes: rankingsData.downvotes,
        rating: rankingsData.rating,
        review_count: rankingsData.review_count
      } : null, 
      error: rankingsError?.message,
      errorDetails: rankingsError?.details
    })

    // Get reviews data with user profiles
    const { data: reviewsData, error: reviewsError } = await supabaseServer
      .from('reviews')
      .select(`
        id,
        content,
        title,
        rating,
        pros,
        cons,
        created_at,
        user_id,
        user:user_profiles(id, email, username, avatar_url)
      `)
      .eq('product_id', productData.id)

    console.log('Reviews query result:', { 
      reviewsCount: reviewsData?.length, 
      error: reviewsError?.message,
      errorDetails: reviewsError?.details,
      firstReview: reviewsData?.[0] ? {
        id: reviewsData[0].id,
        rating: reviewsData[0].rating,
        user: reviewsData[0].user
      } : null
    })

    // Get threads data
    const { data: threadProductsData, error: threadProductsError } = await supabaseServer
      .from('thread_products')
      .select('thread_id')
      .eq('product_id', productData.id)

    if (threadProductsError) {
      console.error('Error fetching thread products:', threadProductsError)
      return null
    }

    const threadIds = threadProductsData.map(tp => tp.thread_id)

    // Get threads with user profiles
    const { data: threadsData, error: threadsError } = await supabaseServer
      .from('threads')
      .select(`
        id,
        title,
        content,
        created_at,
        user_id,
        user:user_profiles(id, email, username, avatar_url)
      `)
      .in('id', threadIds)

    console.log('Threads query result:', { 
      threadsCount: threadsData?.length, 
      error: threadsError?.message,
      errorDetails: threadsError?.details,
      firstThread: threadsData?.[0] ? {
        id: threadsData[0].id,
        title: threadsData[0].title,
        user: threadsData[0].user
      } : null
    })

    // Transform the data into the expected format
    const product: Product = {
      id: productData.id,
      name: productData.name,
      description: productData.description || '',
      category: productData.category,
      price: productData.price || 0,
      url_slug: productData.url_slug,
      image_url: productData.image_url || `/images/products/${productData.category}.png`,
      imageUrl: productData.image_url || `/images/products/${productData.category}.png`,
      specifications: productData.specifications as Record<string, any> | null,
      created_at: productData.created_at,
      updated_at: productData.updated_at,
      upvotes: rankingsData?.upvotes || 0,
      downvotes: rankingsData?.downvotes || 0,
      rating: rankingsData?.rating || 0,
      review_count: rankingsData?.review_count || 0,
      reviews: (reviewsData || []).map(review => ({
        id: review.id,
        content: review.content || '',
        title: review.title || '',
        rating: review.rating || 0,
        pros: review.pros || [],
        cons: review.cons || [],
        created_at: review.created_at,
        user: {
          id: review.user?.[0]?.id || review.user_id || 'anonymous',
          email: review.user?.[0]?.email || '',
          display_name: review.user?.[0]?.username || 'Anonymous',
          avatar_url: review.user?.[0]?.avatar_url
        }
      })),
      threads: (threadsData || []).map(thread => ({
        id: thread.id,
        title: thread.title || '',
        content: thread.content || '',
        created_at: thread.created_at,
        user: {
          id: thread.user?.[0]?.id || thread.user_id || 'anonymous',
          email: thread.user?.[0]?.email || '',
          display_name: thread.user?.[0]?.username || 'Anonymous',
          avatar_url: thread.user?.[0]?.avatar_url
        }
      }))
    }

    console.log('Successfully transformed product:', {
      id: product.id,
      name: product.name,
      category: product.category,
      url_slug: product.url_slug,
      upvotes: product.upvotes,
      downvotes: product.downvotes,
      rating: product.rating,
      review_count: product.review_count,
      reviewsCount: product.reviews?.length,
      threadsCount: product.threads?.length
    })
    return product
  } catch (error) {
    console.error('Error in getProduct:', error)
    return null
  }
}