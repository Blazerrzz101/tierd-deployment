import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Add missing utility functions
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

export function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  
  // Convert to seconds
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) return `${diffSec} seconds ago`;
  
  // Convert to minutes
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  
  // Convert to hours
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
  
  // Convert to days
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  
  // Convert to months
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} month${diffMonth === 1 ? '' : 's'} ago`;
  
  // Convert to years
  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear} year${diffYear === 1 ? '' : 's'} ago`;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price?: number;
  category?: string;
  image?: string;
  upvotes?: number;
  downvotes?: number;
  rating?: number;
  slug?: string;
}

export function normalizeProduct(product: any): Product {
  return {
    id: product.id || '',
    name: product.name || 'Unknown Product',
    description: product.description || '',
    price: typeof product.price === 'number' ? product.price : 0,
    category: product.category || 'Uncategorized',
    image: product.image || '/placeholder.png',
    upvotes: typeof product.upvotes === 'number' ? product.upvotes : 0,
    downvotes: typeof product.downvotes === 'number' ? product.downvotes : 0,
    rating: typeof product.rating === 'number' ? product.rating : 0,
    slug: product.slug || generateSlug(product.name || 'unknown-product'),
  };
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with a single hyphen
    .trim(); // Remove whitespace from the beginning and end
}
