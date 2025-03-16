"use client"

import { FeedConfig } from './types'

export const feedConfig: FeedConfig = {
  updateInterval: 15 * 60 * 1000, // 15 minutes
  retryAttempts: 3,
  retryDelay: 1000,
  sources: [
    {
      id: 'manufacturer-direct',
      name: 'Manufacturer Direct Feed',
      priority: 1,
      baseUrl: process.env.MANUFACTURER_API_URL || '',
      apiKey: process.env.MANUFACTURER_API_KEY
    },
    {
      id: 'retailer-feed',
      name: 'Authorized Retailer Feed',
      priority: 2,
      baseUrl: process.env.RETAILER_API_URL || '',
      apiKey: process.env.RETAILER_API_KEY
    }
  ]
}