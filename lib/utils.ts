import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { CATEGORY_IDS } from "./constants"

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
    'gaming-headsets': CATEGORY_IDS.HEADSETS,
    'gaming-chairs': CATEGORY_IDS.CHAIRS
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