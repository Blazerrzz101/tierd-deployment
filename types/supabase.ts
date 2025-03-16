export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      activities: {
        Row: {
          id: string
          user_id: string
          activity_type: string
          target_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: string
          target_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: string
          target_id?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string
          category: string
          price: number
          image_url: string
          url_slug: string
          specifications: Json
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          description: string
          category: string
          price: number
          image_url: string
          url_slug: string
          specifications?: Json
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          description?: string
          category?: string
          price?: number
          image_url?: string
          url_slug?: string
          specifications?: Json
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      threads: {
        Row: {
          id: string
          title: string
          content: string
          user_id: string
          created_at: string
          updated_at: string
          upvotes: number
          downvotes: number
          mentioned_products: string[]
          is_pinned: boolean
          is_locked: boolean
        }
        Insert: {
          id?: string
          title: string
          content: string
          user_id: string
          created_at?: string
          updated_at?: string
          upvotes?: number
          downvotes?: number
          mentioned_products?: string[]
          is_pinned?: boolean
          is_locked?: boolean
        }
        Update: {
          id?: string
          title?: string
          content?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          upvotes?: number
          downvotes?: number
          mentioned_products?: string[]
          is_pinned?: boolean
          is_locked?: boolean
        }
      }
      users: {
        Row: {
          id: string
          email: string
          username: string
          avatar_url: string | null
          is_online: boolean
          is_public: boolean
          created_at: string
          last_seen: string
        }
        Insert: {
          id: string
          email: string
          username: string
          avatar_url?: string | null
          is_online?: boolean
          is_public?: boolean
          created_at?: string
          last_seen?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          avatar_url?: string | null
          is_online?: boolean
          is_public?: boolean
          created_at?: string
          last_seen?: string
        }
      }
      votes: {
        Row: {
          id: string
          product_id: string
          user_id: string
          vote_type: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          vote_type: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          vote_type?: number
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string
          rating: number
          title: string
          content: string
          pros: string[] | null
          cons: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          rating: number
          title: string
          content: string
          pros?: string[] | null
          cons?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          rating?: number
          title?: string
          content?: string
          pros?: string[] | null
          cons?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      product_mentions: {
        Row: {
          id: string
          thread_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          thread_id?: string
          product_id?: string
          created_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
          email: string | null
          bio: string | null
          preferences: Json
          last_seen: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>
      }
    }
    Views: {
      reddit_threads_view: {
        Row: {
          id: string
          title: string
          subreddit: string
          url: string
          author: string
          upvotes: number
          score: number
          created_at: string
          is_nsfw: boolean
          tags: Array<{
            tag_type: string
            tag_value: string
          }>
        }
      }
      product_rankings: {
        Row: {
          id: string
          name: string
          description: string
          category: string
          category_slug: string
          price: number
          image_url: string
          url_slug: string
          specifications: Json
          upvotes: number
          downvotes: number
          rating: number
          review_count: number
          total_votes: number
          score: number
          rank: number
        }
      }
      category_stats: {
        Row: {
          category: string
          product_count: number
          avg_price: number
          min_price: number
          max_price: number
          total_upvotes: number
          total_downvotes: number
        }
      }
    }
    Functions: {
      fetch_reddit_threads: {
        Args: {
          max_threads?: number
          category?: string | null
        }
        Returns: Array<{
          id: string
          title: string
          subreddit: string
          url: string
          author: string
          upvotes: number
          score: number
          created_at: string
          tags: Array<{
            tag_type: string
            tag_value: string
          }>
        }>
      }
      refresh_rankings: {
        Args: Record<string, never>
        Returns: void
      }
      get_product_rankings: {
        Args: {
          p_category?: string | null
        }
        Returns: {
          id: string
          name: string
          description: string | null
          category: string
          price: number | null
          image_url: string | null
          url_slug: string
          specifications: Json | null
          created_at: string
          updated_at: string
          upvotes: number
          downvotes: number
          rating: number
          review_count: number
          score: number
          rank: number
        }[]
      }
      handle_authenticated_vote: {
        Args: {
          p_product_id: string
          p_vote_type: string
          p_user_id: string
        }
        Returns: {
          success: boolean
          vote_id: string
          vote_type: number
          created_at: string
        }[]
      }
      get_user_votes: {
        Args: {
          p_product_ids?: string[]
        }
        Returns: {
          product_id: string
          vote_type: number
          created_at: string
        }[]
      }
      vote_for_product: {
        Args: {
          p_product_id: string
          p_vote_type: string
        }
        Returns: undefined
      }
    }
    Enums: {
      vote_type: 'upvote' | 'downvote'
      product_category: "gaming-mice" | "gaming-keyboards" | "gaming-monitors" | "gaming-headsets" | "gaming-chairs"
    }
  }
} 