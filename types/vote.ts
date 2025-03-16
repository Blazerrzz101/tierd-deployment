export type VoteType = 'up' | 'down' | null;

export interface Vote {
  id: string;
  product_id: string;
  user_id: string;
  vote_type: VoteType;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface VoteResponse {
  success: boolean;
  vote_id?: string;
  vote_type?: VoteType;
  created_at?: string;
  updated_at?: string;
  message?: string;
} 