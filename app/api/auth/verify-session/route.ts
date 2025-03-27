import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/verify-session
 * Verifies if the current user session is valid
 */
export async function GET(request: NextRequest) {
  try {
    // Get the Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check session validity
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Session verification error:", error);
      return NextResponse.json({
        success: false,
        message: 'Session verification failed',
        error: error.message
      }, { status: 401 });
    }
    
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'No active session found'
      }, { status: 401 });
    }
    
    // Check if token is about to expire (within 5 minutes)
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const tokenExpiryTime = session.expires_at || 0;
    const timeUntilExpiry = tokenExpiryTime - nowInSeconds;
    
    // Session exists but token is about to expire
    if (timeUntilExpiry < 300) {
      return NextResponse.json({
        success: true,
        message: 'Session valid but expiring soon',
        expiresIn: timeUntilExpiry,
        needsRefresh: true
      });
    }
    
    // Valid session
    return NextResponse.json({
      success: true,
      message: 'Session valid',
      user: {
        id: session.user.id,
        email: session.user.email,
        expiresAt: session.expires_at
      }
    });
  } catch (error) {
    console.error("Error verifying session:", error);
    return NextResponse.json({
      success: false,
      message: 'Error verifying session',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export * from './route'; 