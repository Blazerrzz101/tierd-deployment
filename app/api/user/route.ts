import { NextRequest, NextResponse } from 'next/server';
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { UserService } from '@/lib/supabase/user-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user - Retrieve the current user's profile
 */
export async function GET(request: NextRequest) {
  try {
    // Get the user session using the server-side Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Authentication error',
        error: sessionError.message
      }, { status: 401 });
    }
    
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Not authenticated' 
      }, { status: 401 });
    }
    
    // Get user profile data
    const userProfile = await UserService.getUserProfile(session.user.id, supabase);
    
    if (!userProfile) {
      return NextResponse.json({ 
        success: false, 
        message: 'User profile not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || userProfile.username,
        username: userProfile.username,
        avatar_url: session.user.user_metadata?.avatar_url || userProfile.avatar_url,
        bio: userProfile.preferences?.bio || '',
        is_public: userProfile.is_public,
        preferences: {
          notification_settings: typeof userProfile.preferences?.notification_settings === 'string'
            ? JSON.parse(userProfile.preferences.notification_settings)
            : userProfile.preferences?.notification_settings
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error fetching user profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * PUT /api/user - Update the current user's profile
 */
export async function PUT(request: NextRequest) {
  try {
    // Get the user session using the server-side Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Authentication error',
        error: sessionError.message
      }, { status: 401 });
    }
    
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Not authenticated' 
      }, { status: 401 });
    }
    
    // Parse the request body
    const body = await request.json();
    
    // Extract fields from the request body
    const {
      username,
      avatar_url,
      is_public,
      bio,
      notification_settings
    } = body;
    
    // Update user profile
    const result = await UserService.updateUserProfile(
      session.user.id, 
      {
        username,
        avatar_url,
        is_public,
        bio,
        notification_settings
      },
      supabase
    );
    
    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        message: 'Error updating user profile',
        error: result.error
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'User profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error updating user profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 