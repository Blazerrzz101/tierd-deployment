"use client"

import { Vote } from './vote';

export interface Product {
  // Basic product information
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string;
  url_slug: string;
  specifications: Record<string, any>;
  
  // Vote-related fields
  upvotes: number;
  downvotes: number;
  total_votes: number;
  score: number;
  rank: number;
  userVote: number | null; // 1 for upvote, -1 for downvote, null for no vote
  
  // Review-related fields
  rating: number;
  review_count: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Optional relationships
  votes?: Vote[];
  reviews?: any[]; // TODO: Add Review type
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