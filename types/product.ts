"use client"

export interface Product {
  // Basic product information
  id: string;
  name: string;
  description: string;
  category: string;
  category_slug: string;
  price: number;
  imageUrl: string;
  url_slug: string;
  specs: Record<string, any>;
  
  // Vote-related fields
  votes: number;
  upvotes: number;
  downvotes: number;
  total_votes: number;
  score: number;
  rank: number;
  userVote: VoteType;

  // Review-related fields
  rating: number;
  review_count: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export type VoteType = 'up' | 'down' | null;

export interface ProductWithVotes extends Product {
  ranking_score: number;
}