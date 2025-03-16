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
      users: {
        Row: {
          id: string
          username: string
          email: string
          avatar_url: string | null
          is_online: boolean
          is_public: boolean
          created_at: string
          last_seen: string
        }
        Insert: {
          id?: string
          username: string
          email: string
          avatar_url?: string | null
          is_online?: boolean
          is_public?: boolean
          created_at?: string
          last_seen?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          avatar_url?: string | null
          is_online?: boolean
          is_public?: boolean
          created_at?: string
          last_seen?: string
        }
      }
      product_votes: {
        Row: {
          id: string
          product_id: string
          user_id: string
          vote_type: 'up' | 'down'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          vote_type: 'up' | 'down'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          vote_type?: 'up' | 'down'
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
          helpful_count: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          rating: number
          title: string
          content: string
          helpful_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          rating?: number
          title?: string
          content?: string
          helpful_count?: number
          created_at?: string
        }
      }
    }
  }
}