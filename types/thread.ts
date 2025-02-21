import { Product } from "./product"

export interface ThreadUser {
  id: string
  username: string
  avatar_url?: string | null
}

export interface Thread {
  id?: string
  localId?: string
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
  user: ThreadUser
  taggedProducts: Product[]
  userVote?: 'up' | 'down' | null
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