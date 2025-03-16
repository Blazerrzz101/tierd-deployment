"use client"

export interface UserProfile {
  id: string
  username: string
  email: string
  avatarUrl?: string
  isOnline: boolean
  isPublic: boolean
  preferredAccessories: string[]
  activityLog: {
    id: string
    type: 'vote' | 'review' | 'comment'
    productId: string
    productName: string
    timestamp: number
    action: string
  }[]
  createdAt: number
  lastSeen: number
}

export type UserPrivacySettings = {
  isPublic: boolean
  showActivity: boolean
  showPreferences: boolean
}