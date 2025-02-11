export type VoteType = 'up' | 'down'

export interface Vote {
  id: string
  user_id: string
  product_id: string
  vote_type: VoteType
  created_at: string
  updated_at: string
} 