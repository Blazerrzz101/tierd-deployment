// High-quality placeholder with gaming gear theme
export const PLACEHOLDER_IMAGE = `data:image/svg+xml;base64,${Buffer.from(`
<svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="400" fill="url(#gradient)" />
  <defs>
    <linearGradient id="gradient" x1="0" y1="0" x2="400" y2="400" gradientUnits="userSpaceOnUse">
      <stop offset="0%" style="stop-color:#1a1a1a" />
      <stop offset="100%" style="stop-color:#0a0a0a" />
    </linearGradient>
  </defs>
  <path d="M160 200C180 160 200 140 220 140C240 140 260 160 280 200" 
        stroke="#ff4b26" stroke-width="8" stroke-linecap="round" opacity="0.2"/>
  <g opacity="0.1">
    <circle cx="200" cy="200" r="60" stroke="#ff4b26" stroke-width="4"/>
    <circle cx="200" cy="200" r="40" stroke="#ff4b26" stroke-width="4"/>
    <circle cx="200" cy="200" r="20" stroke="#ff4b26" stroke-width="4"/>
  </g>
  <text x="200" y="280" text-anchor="middle" fill="#666" font-family="system-ui" font-size="24">
    No Image
  </text>
</svg>
`).toString('base64')}`

// Placeholder image configuration
export const PLACEHOLDER_IMAGES = {
  // Default placeholder for all products
  DEFAULT: PLACEHOLDER_IMAGE,
  
  // Category-specific placeholders
  GAMING_MICE: PLACEHOLDER_IMAGE,
  KEYBOARDS: PLACEHOLDER_IMAGE,
  HEADSETS: PLACEHOLDER_IMAGE,
  MONITORS: PLACEHOLDER_IMAGE
}

// Function to get placeholder image based on category
export function getPlaceholderImage(category?: string): string {
  if (!category) return PLACEHOLDER_IMAGES.DEFAULT
  
  const categoryKey = category.toUpperCase().replace(/[^A-Z]/g, '_') as keyof typeof PLACEHOLDER_IMAGES
  return PLACEHOLDER_IMAGES[categoryKey] || PLACEHOLDER_IMAGES.DEFAULT
}

// Category IDs
export const CATEGORY_IDS = {
  MICE: 'Gaming Mice',
  KEYBOARDS: 'Gaming Keyboards',
  MONITORS: 'Gaming Monitors',
  HEADSETS: 'Gaming Headsets'
} as const

// Vote types
export const VOTE_TYPES = {
  UP: 'up',
  DOWN: 'down',
} as const

// API endpoints
export const API_ENDPOINTS = {
  PRODUCTS: '/api/products',
  VOTES: '/api/votes',
  CATEGORIES: '/api/categories',
} as const

// Cache keys
export const CACHE_KEYS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  USER_VOTES: 'user-votes',
} as const 