import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Database } from '@/types/supabase'

// Helper function to log errors without exposing sensitive details
function logError(error: any, context: string) {
  console.error(`Middleware ${context} error:`, {
    message: error.message,
    code: error.code,
    status: error.status,
    timestamp: new Date().toISOString()
  })
}

// Check if a string is within the URL path
const includesInPath = (url: string, check: string): boolean => {
  const urlObj = new URL(url)
  return urlObj.pathname.includes(check)
}

/**
 * This middleware is used to:
 * 1. Maintain authentication state across requests
 * 2. Ensure profile-related pages have proper authentication
 * 3. Record page views for analytics
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Initialize the Supabase client
  const supabase = createMiddlewareClient({ req, res })
  
  // Automatically refresh session if needed
  const { data: { session } } = await supabase.auth.getSession()
  
  // Get pathname for later use
  const { pathname } = req.nextUrl
  
  // Special handling for profile routes
  if (pathname.startsWith('/my-profile') || pathname.startsWith('/profile')) {
    // If user is accessing a profile page without auth, add a response header
    // that the client can use to understand they need to refresh auth
    if (!session) {
      // Add a custom header that the client can check
      res.headers.set('X-Auth-Required', 'true')
      
      // If this is an API request, return unauthorized
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({
          success: false,
          message: 'Authentication required'
        }, { status: 401 })
      }
    }
  }
  
  // Set session information in response headers for client-side detection
  // (but don't include sensitive information)
  if (session) {
    res.headers.set('X-Auth-State', 'authenticated')
    res.headers.set('X-Auth-User-Id', session.user.id)
    
    // Add timestamp for potential debugging
    const nowInSeconds = Math.floor(Date.now() / 1000)
    const tokenExpiryTime = session.expires_at || 0
    const timeUntilExpiry = tokenExpiryTime - nowInSeconds
    
    // If token expires soon (within 5 minutes), tell client to refresh
    if (timeUntilExpiry < 300) {
      res.headers.set('X-Auth-Should-Refresh', 'true')
    }
  } else {
    res.headers.set('X-Auth-State', 'unauthenticated')
  }
  
  return res
}

// Only run middleware on specific paths to improve performance
export const config = {
  matcher: [
    '/my-profile/:path*',
    '/profile/:path*',
    '/api/user/:path*',
    '/api/auth/:path*',
    '/admin/:path*'
  ],
} 