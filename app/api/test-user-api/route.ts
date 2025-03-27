import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { UserService } from '@/lib/supabase/user-service';

export const dynamic = 'force-dynamic';

/**
 * Simple test endpoint to verify user API functionality
 * This is a development-only endpoint for testing and debugging
 */
export async function GET(request: NextRequest) {
  try {
    // This should only be enabled in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ 
        success: false, 
        message: 'This endpoint is only available in development mode' 
      }, { status: 403 });
    }
    
    // Get the user session using the server-side Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Authentication error or not logged in',
        error: sessionError?.message
      }, { status: 401 });
    }
    
    // Get current data for comparison
    const currentUserProfile = await UserService.getUserProfile(session.user.id, supabase);
    
    // Run diagnostic verification
    const diagnostics = {
      auth: {
        status: !!session,
        userId: session.user.id,
        email: session.user.email,
        metadata: session.user.user_metadata
      },
      profile: currentUserProfile,
      tables: {
        users: null as any,
        user_preferences: null as any
      }
    };
    
    // Check database tables
    const { data: usersTableData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    diagnostics.tables.users = {
      exists: !!usersTableData,
      error: usersError?.message || null,
      data: usersTableData
    };
    
    const { data: prefsTableData, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    diagnostics.tables.user_preferences = {
      exists: !!prefsTableData,
      error: prefsError?.message || null,
      data: prefsTableData
    };
    
    return NextResponse.json({ 
      success: true, 
      message: 'User API Test Results',
      diagnostics 
    });
  } catch (error) {
    console.error('Error in test-user-api:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error running diagnostics',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 