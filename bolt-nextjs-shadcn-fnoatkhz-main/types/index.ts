export type VoteType = "up" | "down" | null;

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  rank: number;
  votes: number;
  userVote: VoteType | null;
}
