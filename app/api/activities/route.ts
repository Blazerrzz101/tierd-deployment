import { NextRequest, NextResponse } from "next/server"
import fs from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface Activity {
  id: string
  type: "vote" | "comment" | "review"
  action: "upvote" | "downvote" | "comment" | "review"
  productId: string
  productName: string
  timestamp: string
  details?: string
  userId: string
}

const DATA_DIR = path.resolve(process.cwd(), 'data')
const ACTIVITIES_FILE = path.resolve(DATA_DIR, 'activities.json')

// Initialize activities file if it doesn't exist
async function ensureActivitiesFile() {
  if (!existsSync(DATA_DIR)) {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }

  if (!existsSync(ACTIVITIES_FILE)) {
    await fs.writeFile(ACTIVITIES_FILE, JSON.stringify({ activities: [] }), 'utf8')
  }
}

// Get activities from file
async function getActivities(): Promise<Activity[]> {
  try {
    await ensureActivitiesFile()
    const data = await fs.readFile(ACTIVITIES_FILE, 'utf8')
    const { activities } = JSON.parse(data)
    return activities
  } catch (error) {
    console.error('Error reading activities:', error)
    return []
  }
}

// Save activity to file
export async function saveActivity(activity: Activity) {
  try {
    await ensureActivitiesFile()
    const activities = await getActivities()
    activities.unshift(activity) // Add new activity at the beginning
    await fs.writeFile(ACTIVITIES_FILE, JSON.stringify({ activities }, null, 2), 'utf8')
  } catch (error) {
    console.error('Error saving activity:', error)
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    const activities = await getActivities()
    const userActivities = activities.filter(activity => activity.userId === userId)

    return NextResponse.json({
      success: true,
      activities: userActivities
    })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
} 