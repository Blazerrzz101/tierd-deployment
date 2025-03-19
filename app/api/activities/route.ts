import { NextRequest, NextResponse } from "next/server"
import fs from 'fs'
import path from 'path'
import { getProductByIdOrSlug } from "@/utils/product-utils"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface Activity {
  id: string
  type: "vote" | "comment" | "review"
  action: "upvote" | "downvote" | "comment" | "review"
  productId: string
  productName: string
  productSlug?: string
  timestamp: string
  details?: string
  userId?: string
  clientId?: string
}

// Path to the mock data file
const DATA_FILE = path.join(process.cwd(), 'data', 'activities.json')

// Function to get activities from the JSON file
async function getActivities() {
  // Check if data directory exists, create if not
  const dataDir = path.dirname(DATA_FILE)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  // Check if file exists
  if (!fs.existsSync(DATA_FILE)) {
    // Create initial data
    const initialData = [
      {
        id: '1',
        userId: 'user1',
        clientId: 'client1',
        type: 'vote',
        action: 'upvote',
        productId: 'j1k2l3m4-n5o6-p7q8-r9s0-t1u2v3w4x5y6',
        productName: 'ASUS ROG Swift PG279QM',
        productSlug: 'asus-rog-swift-pg279qm',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        userId: 'user1',
        clientId: 'client1',
        type: 'comment',
        action: 'comment',
        productId: 'c8d9e0f1-2a3b-4c5d-6e7f-8g9h0i1j2k3l',
        productName: 'Razer DeathAdder V2',
        productSlug: 'razer-deathadder-v2',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        details: 'Great product!'
      }
    ]
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2))
    return initialData
  }

  // Read file
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8')
    const activities = JSON.parse(data)
    
    // Add productSlug to any activities that don't have it but have a productId
    const updatedActivities = await Promise.all(
      activities.map(async (activity) => {
        if (!activity.productSlug && activity.productId) {
          try {
            const product = await getProductByIdOrSlug(activity.productId);
            if (product && product.url_slug) {
              return {
                ...activity,
                productSlug: product.url_slug
              };
            }
          } catch (error) {
            console.error(`Failed to update activity ${activity.id} with slug:`, error);
          }
        }
        return activity;
      })
    );
    
    // If any activities were updated, save them
    if (JSON.stringify(activities) !== JSON.stringify(updatedActivities)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(updatedActivities, null, 2));
    }
    
    return updatedActivities;
  } catch (error) {
    console.error('Error reading activities file:', error)
    return []
  }
}

// Function to add an activity
async function addActivity(activity: Partial<Activity>) {
  const activities = await getActivities()
  
  // Ensure we have a product slug if we have a product ID
  let productSlug = activity.productSlug;
  if (!productSlug && activity.productId) {
    try {
      const product = await getProductByIdOrSlug(activity.productId);
      if (product && product.url_slug) {
        productSlug = product.url_slug;
      }
    } catch (error) {
      console.error('Failed to get product slug:', error);
    }
  }
  
  const newActivity = {
    id: `${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...activity,
    productSlug
  }
  activities.push(newActivity)
  fs.writeFileSync(DATA_FILE, JSON.stringify(activities, null, 2))
  return newActivity
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const clientId = searchParams.get('clientId')

    console.log(`GET /api/activities - userId: ${userId}, clientId: ${clientId}`);

    // Require either userId or clientId
    if (!userId && !clientId) {
      return NextResponse.json(
        { success: false, error: 'Either userId or clientId is required' },
        { status: 400 }
      )
    }

    const activities = await getActivities()
    
    // Filter activities by userId or clientId
    const filteredActivities = activities.filter(activity => {
      if (userId && activity.userId === userId) {
        return true
      }
      if (clientId && activity.clientId === clientId) {
        return true
      }
      return false
    })

    // Sort by timestamp (most recent first)
    filteredActivities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    console.log(`Returning ${filteredActivities.length} activities`);

    return NextResponse.json({
      success: true,
      activities: filteredActivities
    })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, clientId, type, action, productId, productName, productSlug, details } = body

    console.log(`POST /api/activities - userId: ${userId}, clientId: ${clientId}, productId: ${productId}`);

    // Validate required fields
    if ((!userId && !clientId) || !type || !action || !productId || !productName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Add activity
    const newActivity = await addActivity({
      userId,
      clientId,
      type,
      action,
      productId,
      productName,
      productSlug,
      details
    })

    return NextResponse.json({
      success: true,
      activity: newActivity
    })
  } catch (error) {
    console.error('Error adding activity:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add activity' },
      { status: 500 }
    )
  }
} 