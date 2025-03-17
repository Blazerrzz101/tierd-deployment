import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatting functions
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

export function formatTimeAgo(date: string | Date): string {
  const now = new Date()
  const pastDate = new Date(date)
  const seconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000)
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  }
  
  let counter
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    counter = Math.floor(seconds / secondsInUnit)
    if (counter > 0) {
      return `${counter} ${unit}${counter === 1 ? '' : 's'} ago`
    }
  }
  
  return 'just now'
}

// Data normalization
export function normalizeProduct(product: any) {
  return {
    id: product.id || product.product_id || '',
    name: product.name || product.product_name || '',
    slug: product.slug || generateSlug(product.name || product.product_name || ''),
    description: product.description || '',
    price: product.price || 0,
    category: product.category || '',
    image: product.image_url || product.image || '',
    rating: product.rating || product.average_rating || 0,
    votes: product.votes || 0,
    created_at: product.created_at || new Date().toISOString(),
  }
}

// Slug generation
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

// Type checking helper
export function isServer(): boolean {
  return typeof window === 'undefined'
}

// Safe JSON parsing
export function safeJSONParse(json: string, fallback: any = {}) {
  try {
    return JSON.parse(json)
  } catch (error) {
    return fallback
  }
}
