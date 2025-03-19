import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// File path for local votes storage
const VOTES_FILE_PATH = path.join(process.cwd(), 'data', 'votes.json')

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
      console.log('Successfully read vote state from:', VOTES_FILE_PATH)
      return JSON.parse(fileContent)
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
 * GET handler to retrieve vote state
 */
export async function GET() {
  try {
    // Read votes from local file
    const voteState = readVotesFile()
    
    return NextResponse.json({
      success: true,
      voteState
    })
  } catch (error) {
    console.error('Error in vote state API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 