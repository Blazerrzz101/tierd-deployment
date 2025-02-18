export type VoteType = 'upvote' | 'downvote';

export interface Vote {
  id: string;
  product_id: string;
  user_id: string;
  vote_type: number; // 1 for upvote, -1 for downvote
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface VoteResponse {
  success: boolean;
  vote_id?: string;
  vote_type?: number;
  created_at?: string;
  updated_at?: string;
  message?: string;
} 