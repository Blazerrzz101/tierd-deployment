export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          description: string | null
          category: string
          price: number
          image_url: string | null
          url_slug: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          price: number
          image_url?: string | null
          url_slug: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          price?: number
          image_url?: string | null
          url_slug?: string
          created_at?: string
          updated_at?: string
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
          user_id: string
          product_id: string
          vote_type: 'up' | 'down'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          vote_type: 'up' | 'down'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          vote_type?: 'up' | 'down'
          created_at?: string
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
    }
    Enums: {
      [_ in never]: never
    }
  }
} 