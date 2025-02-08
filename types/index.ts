export type VoteType = 'up' | 'down' | null;

export interface ProductDetails {
  dpi?: string;
  buttons?: string;
  weight?: string;
  connection?: string;
  sensor?: string;
  battery_life?: string;
  rgb?: boolean;
  switches?: string;
  layout?: string;
  driver?: string;
  frequency?: string;
  resolution?: string;
  refresh_rate?: string;
  panel?: string;
  response_time?: string;
  [key: string]: string | boolean | undefined;
}

export interface ProductMetadata {
  manufacturer_url?: string;
  specs_url?: string;
  alternative_images?: string[];
  features?: string[];
  pros?: string[];
  cons?: string[];
  last_updated?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  rank: number;
  votes: number;
  userVote?: VoteType | null;
  imageUrl: string;
  category: string;
  specs: Record<string, string>;
  url_slug: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string;
  content: string;
  created_at: string;
}

export interface ProductVote {
  id: string;
  product_id: string;
  user_id: string;
  vote_type: 'up' | 'down';
  created_at: string;
}
