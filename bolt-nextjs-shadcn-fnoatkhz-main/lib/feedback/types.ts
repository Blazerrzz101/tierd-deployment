"use client"

export type FeedbackType = 'bug' | 'feature' | 'improvement'
export type FeedbackPriority = 'low' | 'medium' | 'high'
export type FeedbackStatus = 'new' | 'in-review' | 'planned' | 'completed'

export interface FeedbackItem {
  id: string
  type: FeedbackType
  description: string
  priority: FeedbackPriority
  status: FeedbackStatus
  createdAt: number
}

export interface FeedbackSubmission {
  type: FeedbackType
  description: string
  priority: FeedbackPriority
}