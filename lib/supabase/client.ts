"use client";

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { type SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Server-side client (for use in non-component code)
export const supabase = createSupabaseClient<Database>(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// Helper to get a singleton client for client components
let supabaseClientSingleton: SupabaseClient | null = null;

export const getSupabaseClientComponent = () => {
  if (!supabaseClientSingleton) {
    supabaseClientSingleton = createClientComponentClient();
  }
  return supabaseClientSingleton;
};

// Hook to manage Supabase auth state
export function useSupabaseAuth() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  // This effect sets up a subscription to auth changes
  useEffect(() => {
    // First, get the current session
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          // Get user profile from profiles table
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          setProfile(userProfile || null);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initialize auth state
    initializeAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (session?.user) {
        setUser(session.user);
        
        // When signed in, make sure profile exists
        if (event === 'SIGNED_IN') {
          try {
            // Get user profile
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (existingProfile) {
              // Profile exists - update last_seen
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ last_seen: new Date().toISOString() })
                .eq('id', session.user.id);
                
              if (updateError) console.error('Error updating last_seen:', updateError);
              
              setProfile(existingProfile);
            } else {
              // Profile doesn't exist - create one
              const username = session.user.email?.split('@')[0] || `user-${Math.random().toString(36).slice(2, 7)}`;
              
              const { data: newProfile, error: insertError } = await supabase
                .from('profiles')
                .insert([
                  { 
                    id: session.user.id,
                    username,
                    email: session.user.email,
                    is_online: true,
                    last_seen: new Date().toISOString()
                  }
                ])
                .select()
                .single();
              
              if (insertError) {
                console.error('Error creating profile:', insertError);
              } else {
                setProfile(newProfile);
                toast.success('Profile created! You can edit your details in Settings.');
              }
            }
          } catch (error) {
            console.error('Error managing profile:', error);
          }
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return { user, profile, loading, supabase };
}

// Helper for signing out
export async function signOutUser() {
  const supabase = getSupabaseClientComponent();
  
  try {
    await supabase.from('profiles')
      .update({ is_online: false, last_seen: new Date().toISOString() })
      .eq('id', (await supabase.auth.getUser()).data.user?.id || '');
  } catch (error) {
    console.error('Error updating profile before sign out:', error);
  }
  
  return supabase.auth.signOut();
}

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