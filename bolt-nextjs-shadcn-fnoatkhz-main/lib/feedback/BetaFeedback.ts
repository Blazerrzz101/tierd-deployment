"use client"

import { FeedbackItem, FeedbackSubmission } from "./types"
import { saveFeedback, loadFeedback } from "./storage"

export class BetaFeedback {
  private static instance: BetaFeedback | null = null
  private feedback: FeedbackItem[] = []

  private constructor() {
    this.feedback = loadFeedback()
  }

  static getInstance(): BetaFeedback {
    if (!BetaFeedback.instance) {
      BetaFeedback.instance = new BetaFeedback()
    }
    return BetaFeedback.instance
  }

  submitFeedback(submission: FeedbackSubmission): void {
    const newFeedback: FeedbackItem = {
      ...submission,
      id: crypto.randomUUID(),
      status: 'new',
      createdAt: Date.now()
    }
    
    this.feedback.push(newFeedback)
    saveFeedback(this.feedback)
  }

  getFeedback(): FeedbackItem[] {
    return [...this.feedback]
  }

  getFeedbackById(id: string): FeedbackItem | undefined {
    return this.feedback.find(item => item.id === id)
  }

  updateFeedbackStatus(id: string, status: FeedbackItem['status']): void {
    this.feedback = this.feedback.map(item =>
      item.id === id ? { ...item, status } : item
    )
    saveFeedback(this.feedback)
  }
}