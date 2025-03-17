import { createClient } from '@supabase/supabase-js';

// Default values as fallbacks when env vars are missing
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

// Create a singleton Supabase client
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
  },
});

// Create a service role client for admin operations
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
});

// Fallback data for testing/development
const mockData = {
  users: [
    {
      id: '12345',
      email: 'user@example.com',
      name: 'Example User',
      created_at: '2023-01-01T00:00:00.000Z',
    },
  ],
  products: [
    {
      id: 'prod_1',
      name: 'Logitech G Pro Superlight',
      slug: 'logitech-g-pro-superlight',
      description: 'Ultra-lightweight gaming mouse designed for esports professionals.',
      price: 149.99,
      category: 'Mice',
      image_url: '/images/products/logitech-g-pro-superlight.jpg',
      average_rating: 4.8,
      votes: 256,
      created_at: '2022-05-15T00:00:00.000Z',
    },
    {
      id: 'prod_2',
      name: 'Steelseries Arctis 7',
      slug: 'steelseries-arctis-7',
      description: 'Wireless gaming headset with superior audio quality and comfort.',
      price: 129.99,
      category: 'Headsets',
      image_url: '/images/products/steelseries-arctis-7.jpg',
      average_rating: 4.6,
      votes: 189,
      created_at: '2022-06-20T00:00:00.000Z',
    },
  ],
  votes: [
    {
      id: 'vote_1',
      product_id: 'prod_1',
      user_id: '12345',
      value: 1,
      created_at: '2023-02-15T00:00:00.000Z',
    },
  ],
  activities: [
    {
      id: 'act_1',
      user_id: '12345',
      type: 'vote',
      resource_id: 'prod_1',
      data: { vote_value: 1 },
      created_at: '2023-02-15T00:00:00.000Z',
    },
  ],
};

// Wrapper for Supabase client with fallbacks
export const safeSupabaseClient = {
  from: (table) => ({
    select: (columns = '*') => {
      // Use the actual client when env vars are available
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return supabaseClient.from(table).select(columns);
      }
      
      // Otherwise provide mock data
      return {
        eq: () => ({
          single: () => Promise.resolve({ data: mockData[table]?.[0], error: null }),
          data: mockData[table] || [],
          error: null,
        }),
        order: () => ({
          limit: () => ({
            data: mockData[table] || [],
            error: null,
          }),
          data: mockData[table] || [],
          error: null,
        }),
        data: mockData[table] || [],
        error: null,
      };
    },
    insert: () => ({
      select: () => Promise.resolve({ data: { id: 'new_id' }, error: null }),
    }),
    update: () => ({
      eq: () => Promise.resolve({ data: {}, error: null }),
    }),
    delete: () => ({
      eq: () => Promise.resolve({ data: {}, error: null }),
    }),
  }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: mockData.users[0] }, error: null }),
    signUp: () => Promise.resolve({ data: { user: mockData.users[0] }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
  },
  rpc: (func, params) => Promise.resolve({ data: [], error: null }),
};

// Function to safely create a server-side Supabase client
export function createServerSupabaseClient() {
  // In production, use the real client when env vars are available
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseClient;
  }
  
  // Otherwise use the safe client
  return safeSupabaseClient;
}

// Function to safely create an admin Supabase client
export function createServerSupabaseAdmin() {
  // In production, use the real admin client when env vars are available
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return supabaseAdmin;
  }
  
  // Otherwise use the safe client
  return safeSupabaseClient;
}

// Export the real clients for direct use
export { supabaseClient, supabaseAdmin };

// Default export is the safe client
export default safeSupabaseClient; 