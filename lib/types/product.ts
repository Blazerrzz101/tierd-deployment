"use client"

// Vote types
export type VoteType = 'up' | 'down';
export type DatabaseVoteType = -1 | 0 | 1;

// Database interfaces
export interface DatabaseVote {
  id: string;
  product_id: string;
  user_id: string;
  vote_type: DatabaseVoteType;
  created_at: string;
  updated_at: string;
}

export interface DatabaseProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  rating: number | null;
  details: Record<string, string>;
  image_url: string;
  created_at: string;
  description: string;
  slug: string;
  metadata?: Record<string, any>;
}

export interface ProductRankings {
  id: string;
  name: string;
  upvotes: number;
  downvotes: number;
  net_score: number;
  rank: number;
}

// Application interfaces
export interface ProductVote {
  id: string;
  product_id: string;
  user_id: string;
  vote_type: VoteType;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string;
  content: string;
  created_at: string;
  helpful_count?: number;
}

export interface Product extends DatabaseProduct {
  // Vote counts from materialized view
  upvotes: number;
  downvotes: number;
  neutral_votes: number;
  
  // Ranking-related fields
  score: number;
  rank?: number;
  controversy_score: number;
  last_vote_timestamp?: string;
  
  // Relationships
  product_votes?: ProductVote[];
  reviews?: Review[];
  userVote?: VoteType | null;
}

export interface ProductStats {
  upvotes: number;
  downvotes: number;
  totalVotes: number;
  activeUsers: number;
  lastUpdated: number;
}