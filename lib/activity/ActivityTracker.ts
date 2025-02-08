"use client"

import { supabase } from "@/lib/supabase/client"

interface UserActivity {
  userId: string
  type: 'view' | 'vote' | 'search' | 'review'
  productId?: string
  timestamp: number
  metadata?: Record<string, any>
}

export class ActivityTracker {
  private static instance: ActivityTracker
  private activities: UserActivity[] = []
  private activeUsers: Set<string> = new Set()
  private readonly ACTIVE_TIMEOUT = 5 * 60 * 1000 // 5 minutes

  private constructor() {
    this.setupRealtimeSubscription()
    this.cleanupInactiveUsers()
  }

  static getInstance(): ActivityTracker {
    if (!ActivityTracker.instance) {
      ActivityTracker.instance = new ActivityTracker()
    }
    return ActivityTracker.instance
  }

  private setupRealtimeSubscription() {
    supabase
      .channel('activities')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'activities' },
        (payload) => {
          // Update local activity state
          const activity = payload.new as UserActivity
          this.activities.push(activity)
          this.activeUsers.add(activity.userId)
          
          // Dispatch event for UI updates
          window.dispatchEvent(new CustomEvent('activity-update', { 
            detail: activity 
          }))
        }
      )
      .subscribe()
  }

  async trackActivity(activity: UserActivity): Promise<void> {
    try {
      const { error } = await supabase
        .from('activities')
        .insert([{
          user_id: activity.userId,
          type: activity.type,
          product_id: activity.productId,
          timestamp: new Date(activity.timestamp).toISOString(),
          metadata: activity.metadata
        }])

      if (error) throw error

      this.activities.push(activity)
      this.activeUsers.add(activity.userId)
    } catch (error) {
      console.error('Error tracking activity:', error)
    }
  }

  getActiveUsersCount(): number {
    return this.activeUsers.size
  }

  private cleanupInactiveUsers(): void {
    setInterval(() => {
      const now = Date.now()
      this.activities = this.activities.filter(
        activity => now - activity.timestamp < this.ACTIVE_TIMEOUT
      )
      this.activeUsers = new Set(this.activities.map(a => a.userId))
    }, 60000) // Check every minute
  }
}