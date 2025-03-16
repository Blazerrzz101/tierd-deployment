"use client"

import { FeedbackItem } from "./types"

const STORAGE_KEY = "beta_feedback"

export function saveFeedback(feedback: FeedbackItem[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(feedback))
  }
}

export function loadFeedback(): FeedbackItem[] {
  if (typeof window === 'undefined') return []
  
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}