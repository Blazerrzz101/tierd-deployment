"use client"

export interface DataSource {
  id: string
  name: string
  priority: number
  baseUrl: string
  apiKey?: string
}

export interface ProductUpdate {
  id: string
  name: string
  price: number
  stock: number
  specs: Record<string, string>
  lastUpdated: number
  source: string
}

export interface FeedConfig {
  updateInterval: number
  retryAttempts: number
  retryDelay: number
  sources: DataSource[]
}