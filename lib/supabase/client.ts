"use client";

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'
import { SupabaseClient } from '@supabase/supabase-js'

// Ensure environment variables are defined
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Initialize the Supabase client
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'public'
    }
  }
)

// Simple connection test that doesn't require auth
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .limit(1)
    
    return !error
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
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
    
    let query = supabase
      .from('products')
      .select(`
        *,
        product_rankings!inner (
          upvotes,
          downvotes,
          net_score,
          rank
        )
        ${options.includeVotes ? ',product_votes (*)' : ''}
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
    throw error;  // Re-throw to let the caller handle it
  }
}

export async function getProducts(
  supabase: SupabaseClient<Database>,
  options: {
    category?: string;
    url_slug?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  let query = supabase
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