"use client"

import { useState, useEffect } from "react"

interface VoteLimiter {
  canVote: boolean
  lastVoteTime: number | null
  resetTime: number | null
  remainingCooldown: number
}

const VOTE_COOLDOWN = 30000 // 30 seconds between votes
const VOTE_LIMIT = 10 // Maximum votes per hour
const VOTE_WINDOW = 3600000 // 1 hour in milliseconds

export function useVoteLimiter(): VoteLimiter {
  const [state, setState] = useState<VoteLimiter>({
    canVote: true,
    lastVoteTime: null,
    resetTime: null,
    remainingCooldown: 0
  })

  useEffect(() => {
    // Load voting history from localStorage
    const votingHistory = JSON.parse(localStorage.getItem("votingHistory") || "[]")
    const now = Date.now()

    // Clean up old votes
    const recentVotes = votingHistory.filter((time: number) => now - time < VOTE_WINDOW)
    
    // Update state based on voting history
    setState({
      canVote: recentVotes.length < VOTE_LIMIT && 
               (!votingHistory[0] || now - votingHistory[0] >= VOTE_COOLDOWN),
      lastVoteTime: votingHistory[0] || null,
      resetTime: votingHistory[0] ? votingHistory[0] + VOTE_WINDOW : null,
      remainingCooldown: votingHistory[0] ? Math.max(0, VOTE_COOLDOWN - (now - votingHistory[0])) : 0
    })

    // Update localStorage
    localStorage.setItem("votingHistory", JSON.stringify(recentVotes))
  }, [])

  useEffect(() => {
    if (state.remainingCooldown > 0) {
      const timer = setInterval(() => {
        setState(prev => ({
          ...prev,
          remainingCooldown: Math.max(0, prev.remainingCooldown - 1000),
          canVote: prev.remainingCooldown <= 1000
        }))
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [state.remainingCooldown])

  return state
}