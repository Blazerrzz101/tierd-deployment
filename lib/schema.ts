import { z } from 'zod';

export const ReviewSchema = z.object({
  id: z.string().min(1, "Review ID is required"),
  product_id: z.string().min(1, "Product ID is required").optional(),
  user_id: z.string().min(1, "User ID is required").optional(),
  rating: z.number().min(0).max(5, "Rating must be between 0 and 5"),
  title: z.string().min(1, "Review title is required"),
  content: z.string().min(1, "Review content is required"),
  created_at: z.string().datetime("Invalid date format"), // Already sanitized to string
});

export const VoteSchema = z.object({
  id: z.string().min(1, "Vote ID is required"),
  product_id: z.string().min(1, "Product ID is required"),
  user_id: z.string().min(1, "User ID is required"),
  vote_type: z.enum(['up', 'down', 'neutral'], {
    required_error: "Vote type must be 'up', 'down', or 'neutral'"
  }),
  created_at: z.string().datetime("Invalid date format"),
  updated_at: z.string().datetime("Invalid date format").optional(),
});

export const ProductSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Product name is required"),
  brand: z.string().min(1, "Brand is required").optional(),
  category: z.string().min(1, "Category is required").optional(),
  price: z.number().positive("Price must be positive").optional(),
  rating: z.number().nullable().optional(),
  details: z.record(z.string()).optional(),
  image_url: z.string().url("Invalid image URL").optional(),
  created_at: z.string().datetime("Invalid date format").optional(),
  description: z.string().min(1, "Description is required").optional(),
  slug: z.string().min(1, "Slug is required"),
  metadata: z.record(z.any()).optional(),
  
  // Ranking-related fields
  upvotes: z.number().int().nonnegative().default(0).optional(),
  downvotes: z.number().int().nonnegative().default(0).optional(),
  neutral_votes: z.number().int().nonnegative().default(0).optional(),
  score: z.number().default(0).optional(),
  rank: z.number().int().nonnegative().optional(),
  ranking: z.number().int().nonnegative().optional(),
  controversy_score: z.number().min(0).max(1).default(0).optional(),
  last_vote_timestamp: z.string().datetime().nullable().optional(),
  
  // Relationships
  reviews: z.array(ReviewSchema).optional(),
  product_votes: z.array(VoteSchema).optional(),
  userVote: z.enum(['up', 'down', 'neutral']).nullable().optional(),
}).partial();

export type Product = z.infer<typeof ProductSchema>;
export type Review = z.infer<typeof ReviewSchema>;
export type Vote = z.infer<typeof VoteSchema>; 