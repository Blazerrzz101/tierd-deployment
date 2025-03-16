import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabaseAuthServer = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export const getCurrentUserServer = async () => {
  const { data: { user }, error } = await supabaseAuthServer.auth.getUser()
  if (error) throw error
  return user
}

export const getSessionServer = async () => {
  const { data: { session }, error } = await supabaseAuthServer.auth.getSession()
  if (error) throw error
  return session
} 