import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'
import { setTimeout } from 'timers/promises'

// File path for local votes storage
const VOTES_FILE_PATH = path.join(process.cwd(), 'data', 'votes.json')

// Keep track of last read timestamp to avoid sending duplicate updates
let lastReadTimestamp: string | null = null

/**
 * Read the local vote state from file
 */
function readVotesFile() {
  try {
    // Ensure directory exists
    const dir = path.dirname(VOTES_FILE_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Read file if it exists, otherwise return empty state
    if (fs.existsSync(VOTES_FILE_PATH)) {
      const fileContent = fs.readFileSync(VOTES_FILE_PATH, 'utf-8')
      const voteState = JSON.parse(fileContent)
      return voteState
    }
    
    return {
      votes: {},
      voteCounts: {},
      lastUpdated: new Date().toISOString(),
      userVotes: []
    }
  } catch (error) {
    console.error('Error reading votes file:', error)
    return {
      votes: {},
      voteCounts: {},
      lastUpdated: new Date().toISOString(),
      userVotes: []
    }
  }
}

/**
 * Check if the vote state has been updated
 */
function hasBeenUpdated(voteState: any): boolean {
  if (!voteState || !voteState.lastUpdated) return false
  
  if (!lastReadTimestamp) {
    // First time checking, save timestamp
    lastReadTimestamp = voteState.lastUpdated
    return true
  }
  
  // Check if the timestamp has changed
  const hasUpdate = voteState.lastUpdated !== lastReadTimestamp
  
  if (hasUpdate) {
    // Update the last read timestamp
    lastReadTimestamp = voteState.lastUpdated
  }
  
  return hasUpdate
}

/**
 * Format message for SSE
 */
function formatServerSentEvent(event: string, data: any): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

/**
 * GET handler for SSE
 */
export async function GET(request: NextRequest) {
  // Set appropriate headers for SSE
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  }
  
  // Create a new readable stream
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial vote state
      const initialVoteState = readVotesFile()
      lastReadTimestamp = initialVoteState.lastUpdated
      
      controller.enqueue(
        formatServerSentEvent('vote-update', { voteState: initialVoteState })
      )
      
      // Keep the connection alive and check for updates every 3 seconds
      try {
        while (true) {
          // Wait 3 seconds
          await setTimeout(3000)
          
          // Check for updates
          const voteState = readVotesFile()
          
          // Only send update if something has changed
          if (hasBeenUpdated(voteState)) {
            controller.enqueue(
              formatServerSentEvent('vote-update', { voteState })
            )
          } else {
            // Send a ping to keep the connection alive
            controller.enqueue(
              formatServerSentEvent('ping', { timestamp: new Date().toISOString() })
            )
          }
        }
      } catch (error) {
        console.error('SSE stream error:', error)
        controller.close()
      }
    }
  })
  
  return new Response(stream, { headers })
} 