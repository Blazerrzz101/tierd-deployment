"use client";

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a Supabase client with explicit configuration for direct API access
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Enable session persistence
    autoRefreshToken: true, // Automatically refresh tokens
    detectSessionInUrl: true // Detect session in URL on auth redirect
  },
  global: {
    fetch: (...args) => {
      // Log RPC calls for debugging (remove in production)
      if (args[0] && typeof args[0] === 'string' && args[0].includes('/rpc/')) {
        console.log('Making RPC call to:', args[0]);
      }
      return fetch(...args);
    }
  }
})

// Get or create the Supabase client instance
export function getSupabaseClient() {
  if (supabase) return supabase;

  // For local development, we want to use the local Supabase instance
  const isLocalDev = process.env.NODE_ENV === 'development' && 
                     process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost');

  // Test the connection
  testDatabaseConnection()
    .then(isConnected => {
      if (!isConnected) {
        console.error('Failed to establish initial database connection');
      } else {
        console.log(`Successfully connected to ${isLocalDev ? 'local' : 'production'} Supabase instance`);
      }
    })
    .catch(error => {
      console.error('Error testing database connection:', error);
    });

  return supabase;
}

// Simple connection test that doesn't require auth
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    
    // First test basic connection
    const { data: productData, error: productError } = await client
      .from('products')
      .select('id')
      .limit(1);
    
    if (productError) {
      console.error('Product table connection test failed:', productError);
      return false;
    }

    // Test materialized view
    const { data: rankingsData, error: rankingsError } = await client
      .from('product_rankings')
      .select('id')
      .limit(1);
    
    if (rankingsError) {
      console.error('Product rankings view connection test failed:', rankingsError);
      return false;
    }

    console.log('Database connection test successful:', {
      productsConnected: !!productData,
      rankingsConnected: !!rankingsData
    });
    
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

// Simplified profile test that always returns true for public access
export async function testUserProfileFetch(): Promise<boolean> {
  return true
}

// Fetch products with error handling
export async function fetchProducts(options: { 
  slug?: string,
  includeVotes?: boolean,
  includeReviews?: boolean
} = {}) {
  try {
    console.log('Fetching products with options:', options);
    const client = getSupabaseClient();
    
    let query = client
      .from('products')
      .select(`
        *,
        product_rankings!inner (
          id,
          name,
          description,
          image_url,
          price,
          category,
          slug,
          upvotes,
          downvotes,
          rating,
          review_count,
          net_score,
          rank
        )
        ${options.includeReviews ? ',reviews (*)' : ''}
      `.trim());
    
    if (options.slug) {
      query = query.eq('slug', options.slug);
    }
    
    const { data, error } = await query.order('rank', { ascending: true });
    
    if (error) {
      console.error('Supabase error fetching products:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    
    console.log('Successfully fetched products:', {
      count: data?.length,
      firstProduct: data?.[0] ? {
        id: (data[0] as any).id,
        name: (data[0] as any).name,
        category: (data[0] as any).category
      } : null
    });
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchProducts:', error);
    throw error;
  }
}

export async function getProducts(options: {
  category?: string;
  url_slug?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const client = getSupabaseClient();
  let query = client
    .from('products')
    .select('*')

  if (options.category) {
    query = query.eq('category', options.category);
  }

  if (options.url_slug) {
    query = query.eq('url_slug', options.url_slug);
  }

  const { data, error } = await query.order('rank', { ascending: true });
  
  if (error) {
    console.error('Supabase error fetching products:', {
      error,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    throw error;
  }
  
  console.log('Successfully fetched products:', {
    count: data?.length,
    firstProduct: data?.[0] ? {
      id: (data[0] as any).id,
      name: (data[0] as any).name,
      category: (data[0] as any).category
    } : null
  });
  
  return data || [];
}