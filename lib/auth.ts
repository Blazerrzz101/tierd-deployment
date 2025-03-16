"use client"

import { UserProfile } from "@/types/user"

// Simulated user data for early-stage testing
const mockUsers: UserProfile[] = [
  {
    id: "1",
    username: "ProGamer",
    email: "progamer@example.com",
    isOnline: true,
    isPublic: true,
    preferredAccessories: ["logitech-g502", "ducky-one-3"],
    activityLog: [
      {
        id: "1",
        type: "vote",
        productId: "logitech-g502",
        productName: "Logitech G502 X PLUS",
        timestamp: Date.now() - 3600000,
        action: "upvoted"
      }
    ],
    createdAt: Date.now() - 86400000,
    lastSeen: Date.now()
  }
]

export async function getCurrentUser(): Promise<UserProfile | null> {
  // TODO: Implement actual auth
  return mockUsers[0]
}

export async function getUserByUsername(username: string): Promise<UserProfile | null> {
  return mockUsers.find(user => user.username === username) || null
}

export async function getKnownUsernames(): Promise<string[]> {
  return mockUsers.map(user => user.username)
}