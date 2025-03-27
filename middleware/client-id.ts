import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * This middleware ensures client ID is available for API requests
 * by extracting it from cookies and adding it to request headers
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Extract client ID from cookies if available
  const clientIdCookie = req.cookies.get('clientId')
  
  if (clientIdCookie && clientIdCookie.value) {
    // Add client ID to headers for API routes
    res.headers.set('X-Client-ID', clientIdCookie.value)
    console.log(`[Middleware] Added client ID from cookie to headers: ${clientIdCookie.value}`)
  }
  
  // Add timestamp for potential debugging
  res.headers.set('X-Request-Time', Date.now().toString())
  
  return res
}

// Only run this middleware on API routes related to voting
export const config = {
  matcher: [
    '/api/vote',
    '/api/vote/(.*)',
    '/api/debug/client-id',
    '/api/debug/client-id/(.*)',
  ],
} 