"use client"

import { useState } from "react"
import { UserProfile } from "@/types/user"

export function useProfile(initialProfile: UserProfile) {
  const [profile, setProfile] = useState(initialProfile)

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(current => ({
      ...current,
      ...updates,
      lastSeen: Date.now()
    }))
  }

  const addActivity = (activity: UserProfile["activityLog"][0]) => {
    setProfile(current => ({
      ...current,
      activityLog: [activity, ...current.activityLog]
    }))
  }

  return {
    profile,
    updateProfile,
    addActivity
  }
}