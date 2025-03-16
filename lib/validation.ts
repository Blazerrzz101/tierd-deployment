import { z } from 'zod'

export const ProductSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters'),
  
  description: z.string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be less than 2000 characters'),
  
  url_slug: z.string()
    .min(1, 'URL slug is required')
    .max(100, 'URL slug must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  
  rating: z.number()
    .min(0, 'Rating must be between 0 and 5')
    .max(5, 'Rating must be between 0 and 5')
    .optional(),
  
  votes: z.number()
    .int('Votes must be an integer')
    .min(0, 'Votes cannot be negative')
    .optional(),
  
  price: z.number()
    .min(0, 'Price cannot be negative')
    .optional(),
  
  category: z.enum([
    'Gaming Mice',
    'Gaming Keyboards',
    'Gaming Headsets',
    'Gaming Monitors',
    'Gaming Chairs'
  ]).optional(),
  
  image_url: z.string()
    .url('Invalid image URL')
    .optional(),
  
  specifications: z.record(z.string(), z.any())
    .optional(),
  
  created_at: z.string()
    .datetime()
    .optional(),
  
  updated_at: z.string()
    .datetime()
    .optional()
}) 