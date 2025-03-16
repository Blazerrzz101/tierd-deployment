import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

export interface UserDetails {
  id: string
  username: string | null
  avatar_url: string | null
  created_at: string
  last_seen: string | null
  is_online: boolean
}

export function useUserDetails(userId: string) {
  return useQuery({
    queryKey: ['user-details', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_details')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data as UserDetails
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  })
} 