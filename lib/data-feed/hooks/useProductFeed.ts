"use client"

import { useState, useEffect } from 'react'
import { FeedManager } from '../FeedManager'
import { feedConfig } from '../config'
import { ProductUpdate } from '../types'

export function useProductFeed() {
  const [updates, setUpdates] = useState<ProductUpdate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const feedManager = FeedManager.getInstance(feedConfig)
    
    const fetchUpdates = async () => {
      try {
        setIsLoading(true)
        const latestUpdates = await feedManager.fetchLatestData()
        setUpdates(latestUpdates)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch updates'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchUpdates()
  }, [])

  return { updates, isLoading, error }
}