import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export const authConfig = {
  providers: ["github", "google"],
  callbacks: {
    async session({ session, user }) {
      const supabase = createServerComponentClient({ cookies })

      if (session?.user) {
        // Fetch user profile data
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        // Fetch user preferences
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single()

        // Merge profile and preferences with session
        return {
          ...session,
          user: {
            ...session.user,
            ...profile,
            preferences
          }
        }
      }
      return session
    },
    async signIn({ user, account, profile }) {
      const supabase = createServerComponentClient({ cookies })

      if (!user?.email) return false

      try {
        // Create or update user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: user.id,
            email: user.email,
            display_name: profile?.name || user.email.split('@')[0],
            avatar_url: profile?.image || null,
            provider: account?.provider,
            last_sign_in: new Date().toISOString()
          })

        if (profileError) throw profileError

        // Create default preferences if they don't exist
        const { error: prefError } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            email_notifications: true,
            theme: 'dark',
            accessibility_mode: false
          })

        if (prefError) throw prefError

        return true
      } catch (error) {
        console.error('Error in signIn callback:', error)
        return false
      }
    }
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
  },
  events: {
    async signOut({ session }) {
      const supabase = createServerComponentClient({ cookies })
      
      if (session?.user?.id) {
        // Update last seen timestamp
        await supabase
          .from('user_profiles')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', session.user.id)
      }
    }
  }
} 