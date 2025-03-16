import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { CATEGORY_IDS } from "./constants"
import { Product } from "@/types/product"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function formatPrice(price: number | null | undefined): string {
  if (price == null) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatTimeAgo(date: string | Date): string {
  const now = new Date()
  const past = new Date(date)
  const msPerMinute = 60 * 1000
  const msPerHour = msPerMinute * 60
  const msPerDay = msPerHour * 24
  const msPerMonth = msPerDay * 30
  const msPerYear = msPerDay * 365

  const elapsed = now.getTime() - past.getTime()

  if (elapsed < msPerMinute) {
    const seconds = Math.round(elapsed/1000)
    return `${seconds} ${seconds === 1 ? 'second' : 'seconds'} ago`
  }

  else if (elapsed < msPerHour) {
    const minutes = Math.round(elapsed/msPerMinute)
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  }

  else if (elapsed < msPerDay ) {
    const hours = Math.round(elapsed/msPerHour)
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  }

  else if (elapsed < msPerMonth) {
    const days = Math.round(elapsed/msPerDay)
    return `${days} ${days === 1 ? 'day' : 'days'} ago`
  }

  else if (elapsed < msPerYear) {
    const months = Math.round(elapsed/msPerMonth)
    return `${months} ${months === 1 ? 'month' : 'months'} ago`
  }

  else {
    const years = Math.round(elapsed/msPerYear)
    return `${years} ${years === 1 ? 'year' : 'years'} ago`
  }
}

export function slugToCategory(slug: string): string | null {
  const categoryMap = {
    'gaming-mice': CATEGORY_IDS.MICE,
    'gaming-keyboards': CATEGORY_IDS.KEYBOARDS,
    'gaming-monitors': CATEGORY_IDS.MONITORS,
    'gaming-headsets': CATEGORY_IDS.HEADSETS
  }
  return categoryMap[slug as keyof typeof categoryMap] || null
}

export function categoryToSlug(category: string): string {
  return category.toLowerCase().replace(/\s+/g, '-')
}

export function sanitizeData(data: any): any {
  if (data === null || data === undefined) {
    return data
  }

  if (data instanceof Date) {
    return data.toISOString()
  }

  if (typeof data === 'object' && 'toJSON' in data && typeof data.toJSON === 'function') {
    return data.toJSON()
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item))
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, any> = {}
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeData(value)
    }
    return sanitized
  }

  return data
}

// Helper function to normalize product data
export function normalizeProduct(data: any): Required<Product> {
  if (!data) {
    console.error("No product data provided")
    throw new Error("No product data provided")
  }

  console.log("Normalizing product data:", {
    id: data.id || data.product_id,
    name: data.name || data.product_name,
    category: data.category || data.product_category,
    reviews: data.reviews?.length || 0,
    threads: data.threads?.length || 0
  })

  // Handle various ID formats
  const id = data.id || data.product_id
  if (!id) {
    console.error("Missing product ID in data:", data)
    throw new Error("Missing product ID")
  }

  // Handle various name formats
  const name = data.name || data.product_name || data.title
  if (!name) {
    console.error("Missing product name in data:", data)
    throw new Error("Missing product name")
  }

  // Handle various category formats
  const category = data.category || data.product_category || "Uncategorized"

  // Generate URL slug if not provided
  const url_slug = data.url_slug || data.slug || generateSlug(name)

  // Handle various image URL formats
  const imageUrl = data.image_url || data.imageUrl || data.image || "/placeholder.png"
  const images = Array.isArray(data.images) ? data.images : [imageUrl]

  // Handle various specification formats
  const specs = data.specifications || data.specs || data.details || {}

  // Handle vote-related fields
  const upvotes = Number(data.upvotes || data.up_votes || data.positive_votes || 0)
  const downvotes = Number(data.downvotes || data.down_votes || data.negative_votes || 0)
  const votes = {
    up: upvotes,
    down: downvotes
  }
  const total_votes = upvotes + downvotes
  
  // Handle user vote data
  const userVote = data.userVote || data.user_vote || null
  const normalizedUserVote = userVote ? {
    hasVoted: userVote.hasVoted !== undefined ? Boolean(userVote.hasVoted) : (userVote.voteType !== undefined && userVote.voteType !== null),
    voteType: userVote.voteType !== undefined ? userVote.voteType : null
  } : {
    hasVoted: false,
    voteType: null
  }

  // Handle review-related fields
  const rating = Number(data.rating || data.average_rating || 0)
  const review_count = Number(data.review_count || data.total_reviews || 0)

  // Handle nested relationships
  const reviews = Array.isArray(data.reviews) ? data.reviews.map((review: any) => ({
    id: String(review.id),
    rating: Number(review.rating || 0),
    content: String(review.content || review.text || ""),
    created_at: review.created_at || new Date().toISOString(),
    user: review.user ? {
      id: String(review.user.id || review.user_id || ""),
      username: String(review.user.username || review.user_name || "Anonymous"),
      avatar_url: review.user.avatar_url || null
    } : {
      id: String(review.user_id || ""),
      username: "Anonymous",
      avatar_url: null
    }
  })) : []

  const threads = Array.isArray(data.threads) ? data.threads.map((thread: any) => ({
    id: String(thread.id),
    title: String(thread.title || ""),
    content: String(thread.content || thread.text || ""),
    created_at: thread.created_at || new Date().toISOString(),
    user: thread.user ? {
      id: String(thread.user.id || thread.user_id || ""),
      username: String(thread.user.username || thread.user_name || "Anonymous"),
      avatar_url: thread.user.avatar_url || null
    } : {
      id: String(thread.user_id || ""),
      username: "Anonymous",
      avatar_url: null
    }
  })) : []

  try {
    // Normalize the product data
    return {
      id: String(id),
      name: String(name),
      description: String(data.description || data.product_description || ""),
      category: String(category),
      price: Number(data.price || data.product_price || 0),
      image_url: imageUrl,
      imageUrl, // For backward compatibility
      images,
      url_slug,
      specifications: specs,
      rating,
      review_count,
      upvotes,
      downvotes,
      score: Number(data.score || data.ranking_score || data.total_score || 0),
      rank: Number(data.rank || data.ranking || 0),
      userVote: normalizedUserVote,
      reviews,
      threads,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString()
    }
  } catch (error) {
    console.error("Error normalizing product data:", error, data)
    throw error
  }
}