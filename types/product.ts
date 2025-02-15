"use client"

export interface Product {
  id: string
  name: string
  description: string | null
  category: string
  price: number | null
  image_url: string | null
  url_slug: string
  created_at: string
  updated_at: string
  rank?: number
  votes: number
  upvotes?: number
  downvotes?: number
  userVote?: 'up' | 'down' | null
  rating?: number
  review_count?: number
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock'
  details?: {
    images?: Record<string, string>
    stock_quantity?: number
    [key: string]: unknown
  }
  metadata?: {
    upvotes?: number
    downvotes?: number
    userVote?: 'up' | 'down' | null
    [key: string]: unknown
  }
  specifications?: Record<string, unknown>
  relatedProducts?: Array<{
    id: string
    name: string
    url_slug: string
    price: number | null
    votes: number
    category: string
  }>
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
}

export type VoteType = 'up' | 'down' | null

export interface ProductWithVotes extends Product {
  upvotes: number
  downvotes: number
  last_vote_timestamp?: string
}