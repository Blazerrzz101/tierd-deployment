"use client"

import { useState, useEffect } from "react"

interface ReviewLimiter {
  canReview: boolean
  lastReviewTime: number | null
  resetTime: number | null
  remainingCooldown: number
}

const REVIEW_COOLDOWN = 24 * 60 * 60 * 1000 // 24 hours between reviews
const REVIEW_LIMIT = 3 // Maximum reviews per day
const REVIEW_WINDOW = 24 * 60 * 60 * 1000 // 24 hours

export function useReviewLimiter(): ReviewLimiter {
  const [state, setState] = useState<ReviewLimiter>({
    canReview: true,
    lastReviewTime: null,
    resetTime: null,
    remainingCooldown: 0
  })

  useEffect(() => {
    // Load review history from localStorage
    const reviewHistory = JSON.parse(localStorage.getItem("reviewHistory") || "[]")
    const now = Date.now()

    // Clean up old reviews
    const recentReviews = reviewHistory.filter((time: number) => now - time < REVIEW_WINDOW)
    
    // Update state based on review history
    setState({
      canReview: recentReviews.length < REVIEW_LIMIT && 
                 (!reviewHistory[0] || now - reviewHistory[0] >= REVIEW_COOLDOWN),
      lastReviewTime: reviewHistory[0] || null,
      resetTime: reviewHistory[0] ? reviewHistory[0] + REVIEW_WINDOW : null,
      remainingCooldown: reviewHistory[0] ? Math.max(0, REVIEW_COOLDOWN - (now - reviewHistory[0])) : 0
    })

    // Update localStorage
    localStorage.setItem("reviewHistory", JSON.stringify(recentReviews))
  }, [])

  return state
}