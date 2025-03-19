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

    // Refresh session if exists - required for Server Components
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession()

    if (sessionError) {
      logError(sessionError, 'session refresh')
    }

    // Add response headers for debugging
    res.headers.set('X-Request-ID', crypto.randomUUID())
    res.headers.set('X-Process-Time', `${Date.now() - startTime}ms`)

    // Handle product page requests
    if (request.nextUrl.pathname.startsWith('/products/')) {
      const slug = request.nextUrl.pathname.split('/')[2]
      if (slug) {
        const { data: product, error: productError } = await supabase
          .rpc('get_product_details', { p_slug: slug })

        if (productError) {
          logError(productError, 'product lookup')
          return NextResponse.redirect(new URL('/404', request.url))
        }

        if (!product || product.length === 0) {
          console.log(`Product not found for slug: ${slug}`)
          return NextResponse.redirect(new URL('/404', request.url))
        }
      }
    }

    // List of routes that always require authentication
    const protectedRoutes = [
      '/dashboard',
      '/settings',
      '/profile',
      '/submit-review',
      '/create-thread'
    ]

    // Check if the current route requires authentication
    if (protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
      if (!session) {
        const redirectUrl = new URL('/auth/sign-in', request.url)
        redirectUrl.searchParams.set('next', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }

    // Handle auth pages - redirect to home if already authenticated
    const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
    if (session && isAuthPage) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Handle health checks
    if (request.nextUrl.pathname === '/api/health') {
      console.log('Health check route detected in middleware')
      return NextResponse.next()
    }

    // Check if we're dealing with an API route
    if (request.nextUrl.pathname.startsWith('/api/')) {
      // Send API requests through to the App Router
      return NextResponse.next()
    }

    // Redirect any URLs with 'undefined' in them
    if (includesInPath(request.nextUrl.toString(), '/products/undefined') || 
        request.nextUrl.pathname === '/products/undefined') {
      console.log('Intercepted undefined product URL:', request.nextUrl.toString());
      console.log('Referer:', request.headers.get('referer'));
      console.log('User-Agent:', request.headers.get('user-agent'));
      
      // Redirect to the products page
      const url = request.nextUrl.clone()
      url.pathname = '/products'
      return NextResponse.redirect(url)
    }
    
    // Handle malformed products URL without additional path (when just /products is requested)
    // This handles the case when the Select component error occurs
    if (request.nextUrl.pathname === '/products' && request.headers.get('referer')?.includes('/products/')) {
      console.log('Redirecting from bare /products to home with products section');
      console.log('Referer:', request.headers.get('referer'));
      
      // Redirect to home page with products section
      return NextResponse.redirect(new URL('/#products', request.url))
    }
    
    // Handle other potentially malformed product URLs
    if (request.nextUrl.pathname.startsWith('/products/')) {
      const slugPart = request.nextUrl.pathname.split('/products/')[1]
      console.log('Processing product URL with slug:', slugPart);
      
      // Check for various invalid slug patterns
      if (
        !slugPart ||
        slugPart === 'null' || 
        slugPart === 'NaN' || 
        slugPart.includes('undefined') ||
        slugPart.length < 3
      ) {
        console.log('Intercepted invalid product URL:', request.nextUrl.toString());
        console.log('Slug part:', slugPart);
        console.log('Referer:', request.headers.get('referer'));
        
        // Redirect to products listing
        const url = request.nextUrl.clone()
        url.pathname = '/products'
        return NextResponse.redirect(url)
      }
    }

    // For all other routes, allow access regardless of authentication status
    return res

  } catch (error) {
    logError(error, 'unexpected')
    
    // Return a basic response without exposing error details
    const res = NextResponse.next()
    res.headers.set('X-Error', 'Internal middleware error')
    return res
  }
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth/ (auth callbacks)
     * 2. /favicon.ico, etc. (static files)
     * 3. /_next/ (Next.js internals)
     * 4. /_static/ (static file serving)
     * 5. /_vercel/ (Vercel internals)
     * 6. /images/, /fonts/, /public/ (public assets)
     */
    '/((?!_next|_static|_vercel|images|fonts|public|favicon.ico).*)',
    '/api/:path*',
    // Apply to all product paths
    '/products/:path*',
    // And any other potential invalid URL paths
    '/:path*/undefined/:path*',
    '/undefined/:path*'
  ],
} 