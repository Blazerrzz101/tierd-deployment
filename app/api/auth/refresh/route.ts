import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/refresh
 * Refreshes the current user session
 */
export async function POST(request: NextRequest) {
  try {
    // Get request ID for logging if provided
    const requestId = request.headers.get('X-Request-ID') || 'unknown';
    console.log(`[${requestId}] Session refresh requested`);
    
    // Get the Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Attempt to refresh the session
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error(`[${requestId}] Session refresh error:`, error);
      return NextResponse.json({
        success: false,
        message: 'Unable to refresh session',
        error: error.message
      }, { status: 401 });
    }
    
    if (!data.session) {
      console.log(`[${requestId}] No session returned after refresh attempt`);
      return NextResponse.json({
        success: false,
        message: 'No session available to refresh'
      }, { status: 401 });
    }
    
    // Successfully refreshed
    console.log(`[${requestId}] Session refreshed successfully, expires at:`, data.session.expires_at);
    
    return NextResponse.json({
      success: true,
      message: 'Session refreshed successfully',
      expiresAt: data.session.expires_at
    });
  } catch (error) {
    console.error("Error refreshing session:", error);
    return NextResponse.json({
      success: false,
      message: 'Error refreshing session',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 