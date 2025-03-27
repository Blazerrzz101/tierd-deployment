import { supabase as defaultClient } from './client';
import { SupabaseClient } from '@supabase/supabase-js';

// Enhanced error class for user operations
export class UserServiceError extends Error {
  public readonly code: string;
  public readonly originalError?: any;
  public readonly recoverable: boolean;
  
  constructor(message: string, code: string, originalError?: any, recoverable = false) {
    super(message);
    this.name = 'UserServiceError';
    this.code = code;
    this.originalError = originalError;
    this.recoverable = recoverable;
  }
}

/**
 * Service for managing user data in Supabase
 */
export const UserService = {
  /**
   * Get user profile data by userId
   * 
   * @param userId - The user's ID
   * @param client - Optional Supabase client to use (defaults to client-side client)
   * @returns User profile data or null if not found
   */
  async getUserProfile(userId: string, client: SupabaseClient = defaultClient) {
    try {
      // Get user data from the users table
      const { data: userData, error: userError } = await client
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError) {
        // Handle special case for not found - create a new user profile
        if (userError.code === 'PGRST116') {
          console.log(`User profile not found for ${userId}, will create a new profile`);
          
          // Try to get user from auth data to create a profile
          const { data: { user } } = await client.auth.getUser();
          
          if (user) {
            // Auto-create a user profile if it doesn't exist yet
            await this.updateUserProfile(userId, {
              username: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              avatar_url: user.user_metadata?.avatar_url,
              is_public: true
            }, client);
            
            // Retry fetching the profile
            const { data: newUserData } = await client
              .from('users')
              .select('*')
              .eq('id', userId)
              .single();
              
            if (newUserData) {
              return {
                ...newUserData,
                preferences: null
              };
            }
          }
        }
        
        throw new UserServiceError(
          `Error fetching user data: ${userError.message}`, 
          userError.code || 'USER_FETCH_ERROR',
          userError,
          userError.code === 'PGRST116' // Only recoverable if just not found
        );
      }
      
      // Get user preferences
      const { data: preferencesData, error: preferencesError } = await client
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      // If preferences not found, create default preferences
      if (preferencesError && preferencesError.code === 'PGRST116') {
        // Create default preferences
        const defaultPreferences = {
          user_id: userId,
          notification_settings: JSON.stringify({
            emailNotifications: true,
            darkMode: false
          }),
          bio: ''
        };
        
        await client
          .from('user_preferences')
          .upsert(defaultPreferences);
          
        // Return user with default preferences
        return {
          ...userData,
          preferences: defaultPreferences
        };
      }
      
      // Combine the data
      return {
        ...userData,
        preferences: preferencesError ? null : preferencesData
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      // Try to get cached profile from localStorage if available on client side
      if (typeof window !== 'undefined') {
        try {
          const cachedProfileStr = localStorage.getItem(`user-profile-${userId}`);
          if (cachedProfileStr) {
            const cachedProfile = JSON.parse(cachedProfileStr);
            console.log('Using cached profile due to fetch error');
            return cachedProfile;
          }
        } catch (cacheError) {
          console.error('Error retrieving cached profile:', cacheError);
        }
      }
      
      if (error instanceof UserServiceError) {
        throw error;
      }
      
      throw new UserServiceError(
        'Error fetching user profile', 
        'PROFILE_FETCH_ERROR',
        error,
        false
      );
    }
  },
  
  /**
   * Update user profile data
   * 
   * @param userId - The user's ID
   * @param profileData - The profile data to update
   * @param client - Optional Supabase client to use (defaults to client-side client)
   * @returns Success status and error message if applicable
   */
  async updateUserProfile(
    userId: string, 
    profileData: {
      username?: string;
      avatar_url?: string;
      bio?: string;
      is_public?: boolean;
      notification_settings?: {
        emailNotifications?: boolean;
        darkMode?: boolean;
      };
    },
    client: SupabaseClient = defaultClient
  ) {
    try {
      // Validate input
      if (!userId) {
        throw new UserServiceError('User ID is required', 'MISSING_USER_ID', null, false);
      }
      
      // Log update attempt for debugging
      console.log(`Updating profile for user ${userId} with data:`, { 
        ...profileData, 
        avatar_url: profileData.avatar_url ? '[URL HIDDEN]' : undefined
      });
      
      // First update the auth metadata
      if (profileData.username || profileData.avatar_url) {
        const { error: authUpdateError } = await client.auth.updateUser({
          data: { 
            name: profileData.username,
            avatar_url: profileData.avatar_url
          }
        });
        
        if (authUpdateError) {
          console.error('Auth update error:', authUpdateError);
          
          // Special handling for auth-related errors
          if (authUpdateError.message.includes('not authenticated')) {
            throw new UserServiceError(
              'Authentication error - user not authenticated', 
              'AUTH_NOT_AUTHENTICATED',
              authUpdateError,
              true // Potentially recoverable with re-auth
            );
          }
          
          throw new UserServiceError(
            `Error updating auth data: ${authUpdateError.message}`,
            'AUTH_UPDATE_ERROR',
            authUpdateError,
            false
          );
        }
      }
      
      // Update user profile in users table
      const { error: profileUpdateError } = await client
        .from('users')
        .upsert({
          id: userId,
          username: profileData.username,
          avatar_url: profileData.avatar_url,
          is_public: profileData.is_public !== undefined ? profileData.is_public : true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      
      if (profileUpdateError) {
        throw new UserServiceError(
          `Error updating user profile: ${profileUpdateError.message}`,
          'PROFILE_UPDATE_ERROR',
          profileUpdateError,
          false
        );
      }
      
      // Update user preferences if provided
      if (profileData.notification_settings || profileData.bio !== undefined) {
        // First check if preferences exist
        const { data: existingPrefs } = await client
          .from('user_preferences')
          .select('notification_settings')
          .eq('user_id', userId)
          .single();
          
        // Merge with existing notification settings if available
        let mergedSettings = profileData.notification_settings;
        if (existingPrefs && existingPrefs.notification_settings) {
          try {
            const existingSettings = typeof existingPrefs.notification_settings === 'string' 
              ? JSON.parse(existingPrefs.notification_settings)
              : existingPrefs.notification_settings;
              
            mergedSettings = {
              ...existingSettings,
              ...profileData.notification_settings
            };
          } catch (e) {
            console.error('Error parsing existing settings:', e);
          }
        }
        
        const { error: preferencesError } = await client
          .from('user_preferences')
          .upsert({
            user_id: userId,
            notification_settings: mergedSettings ? JSON.stringify(mergedSettings) : undefined,
            bio: profileData.bio,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        
        if (preferencesError) {
          throw new UserServiceError(
            `Error updating user preferences: ${preferencesError.message}`,
            'PREFERENCES_UPDATE_ERROR',
            preferencesError,
            false
          );
        }
      }
      
      // Cache the updated profile for offline/error fallback
      if (typeof window !== 'undefined') {
        try {
          // Get the updated profile to cache
          const updatedProfile = await this.getUserProfile(userId, client);
          if (updatedProfile) {
            localStorage.setItem(`user-profile-${userId}`, JSON.stringify(updatedProfile));
          }
        } catch (e) {
          console.error('Error caching updated profile:', e);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating user profile:', error);
      
      if (error instanceof UserServiceError) {
        return { 
          success: false, 
          error: error.message,
          code: error.code,
          recoverable: error.recoverable
        };
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'UNKNOWN_ERROR',
        recoverable: false
      };
    }
  },
  
  /**
   * Get a user's activities (votes, comments, etc.)
   * 
   * @param userId - The user's ID
   * @param limit - Maximum number of activities to retrieve
   * @param client - Optional Supabase client to use (defaults to client-side client)
   * @returns Array of user activities
   */
  async getUserActivities(
    userId: string, 
    limit = 10,
    client: SupabaseClient = defaultClient
  ) {
    try {
      // Fetch user votes
      const { data: votes, error: votesError } = await client
        .from('votes')
        .select('*, products:product_id(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (votesError) {
        throw new UserServiceError(
          `Error fetching user votes: ${votesError.message}`,
          'VOTES_FETCH_ERROR',
          votesError,
          false
        );
      }
      
      // Transform the votes into an activity format
      const activities = votes.map(vote => ({
        id: `vote-${vote.id}`,
        type: 'vote',
        action: vote.vote_type === 'upvote' ? 'upvoted' : 'downvoted',
        target: vote.products?.name || 'Unknown Product',
        target_id: vote.product_id,
        created_at: vote.created_at
      }));
      
      return activities;
    } catch (error) {
      console.error('Error fetching user activities:', error);
      return [];
    }
  },
  
  /**
   * Update user preference settings (like dark mode, email notifications)
   * 
   * @param userId - The user's ID
   * @param settings - Preference settings to update
   * @param client - Optional Supabase client to use
   * @returns Success status
   */
  async updateUserPreferences(
    userId: string,
    settings: {
      darkMode?: boolean;
      emailNotifications?: boolean;
      is_public?: boolean;
    },
    client: SupabaseClient = defaultClient
  ) {
    try {
      // Apply dark mode change immediately in browser
      if (typeof window !== 'undefined' && settings.darkMode !== undefined) {
        if (settings.darkMode) {
          document.documentElement.classList.remove('light');
          document.documentElement.classList.add('dark');
          document.documentElement.style.colorScheme = 'dark';
          localStorage.setItem('tierd-theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
          document.documentElement.style.colorScheme = 'light';
          localStorage.setItem('tierd-theme', 'light');
        }
      }
      
      // First, get current notification settings to merge with
      const { data: prefsData, error: prefsError } = await client
        .from('user_preferences')
        .select('notification_settings')
        .eq('user_id', userId)
        .single();
        
      // Parse existing notification settings
      let currentSettings = {};
      if (prefsData?.notification_settings) {
        try {
          currentSettings = typeof prefsData.notification_settings === 'string'
            ? JSON.parse(prefsData.notification_settings)
            : prefsData.notification_settings;
        } catch (e) {
          console.error('Error parsing notification settings:', e);
        }
      }
      
      // Merge with new settings
      const mergedSettings = {
        ...currentSettings,
        darkMode: settings.darkMode,
        emailNotifications: settings.emailNotifications
      };
      
      // Update user preferences
      const { error: updateError } = await client
        .from('user_preferences')
        .upsert({
          user_id: userId,
          notification_settings: JSON.stringify(mergedSettings),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
        
      if (updateError) {
        throw new UserServiceError(
          `Error updating preferences: ${updateError.message}`,
          'PREFERENCES_UPDATE_ERROR',
          updateError,
          false
        );
      }
      
      // Update is_public status if provided
      if (settings.is_public !== undefined) {
        const { error: profileError } = await client
          .from('users')
          .update({ is_public: settings.is_public })
          .eq('id', userId);
          
        if (profileError) {
          throw new UserServiceError(
            `Error updating profile visibility: ${profileError.message}`,
            'PROFILE_VISIBILITY_ERROR',
            profileError,
            false
          );
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating user preferences:', error);
      
      if (error instanceof UserServiceError) {
        return { 
          success: false, 
          error: error.message,
          code: error.code
        };
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'UNKNOWN_ERROR'
      };
    }
  }
}; 