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

export async function middleware(request: NextRequest) {
  try {
    const startTime = Date.now()
    console.log(`[${request.method}] ${request.url} - Processing request`)

    // Create a response object that we can modify
    const res = NextResponse.next()

    // Create the Supabase client
    const supabase = createMiddlewareClient<Database>({ 
      req: request, 
      res
    })

    // Refresh session if expired
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession()

    if (sessionError) {
      logError(sessionError, 'session refresh')
      // Don't throw here - continue with a null session
    }

    // If there's no session but there are supabase-related cookies, clear them
    if (!session) {
      const cookies = request.cookies.getAll()
      let cookiesCleared = 0

      cookies.forEach(cookie => {
        if (cookie.name.includes('sb-')) {
          res.cookies.delete(cookie.name)
          cookiesCleared++
        }
      })

      if (cookiesCleared > 0) {
        console.log(`Cleared ${cookiesCleared} stale auth cookies`)
      }
    }

    // Add response headers for debugging
    res.headers.set('X-Request-ID', crypto.randomUUID())
    res.headers.set('X-Process-Time', `${Date.now() - startTime}ms`)

    // Handle product page requests
    if (request.nextUrl.pathname.startsWith('/products/')) {
      const slug = request.nextUrl.pathname.split('/')[2]
      if (slug) {
        const { data: product } = await supabase
          .from('product_rankings')
          .select('url_slug')
          .eq('url_slug', slug)
          .single()

        if (!product) {
          return NextResponse.redirect(new URL('/404', request.url))
        }
      }
    }

    // Handle protected routes
    const protectedRoutes = ['/dashboard', '/settings', '/profile']
    if (protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
      if (!session) {
        const redirectUrl = new URL('/auth/sign-in', request.url)
        redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }

    // Handle rate limiting
    const ip = request.ip || 'unknown'
    const rateLimitKey = `rate_limit:${ip}`
    const { data: rateLimit } = await supabase
      .from('rate_limits')
      .select('count, last_reset')
      .eq('key', rateLimitKey)
      .single()

    if (rateLimit && rateLimit.count > 100) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }

    return res
  } catch (error) {
    logError(error, 'unexpected')
    
    // Return a basic response without exposing error details
    const res = NextResponse.next()
    res.headers.set('X-Error', 'Internal middleware error')
    return res
  }
}

// Specify which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     * - health check endpoint
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api|health).*)'
  ],
} 