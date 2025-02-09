import { Product } from "./product"

export interface Thread {
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
  userVote?: 'up' | 'down' | null
  user?: {
    username: string
    avatar_url?: string
  }
  products?: Product[]
}

export interface ThreadComment {
  id: string
  thread_id: string
  user_id: string
  content: string
  parent_comment_id?: string
  created_at: string
  updated_at: string
  upvotes: number
  downvotes: number
  userVote?: 'up' | 'down' | null
  user?: {
    username: string
    avatar_url?: string
  }
  replies?: ThreadComment[]
}