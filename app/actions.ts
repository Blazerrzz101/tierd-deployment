'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function handleVote(productId: string, voteType: 'up' | 'down' | null) {
  const supabase = createServerActionClient({ cookies })
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { error } = await supabase
      .from('product_votes')
      .upsert({
        product_id: productId,
        user_id: user.id,
        vote_type: voteType,
        updated_at: new Date().toISOString()
      })

    if (error) throw error

    // Revalidate the product page and any pages that show rankings
    revalidatePath('/products/[slug]')
    revalidatePath('/')
    
    return { success: true }
  } catch (error) {
    console.error('Error in handleVote:', error)
    return { success: false, error: 'Failed to submit vote' }
  }
}

export async function getUserVote(productId: string) {
  const supabase = createServerActionClient({ cookies })
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { userVote: null }
    }

    const { data, error } = await supabase
      .from('product_votes')
      .select('vote_type')
      .eq('product_id', productId)
      .eq('user_id', user.id)
      .single()

    if (error) throw error

    return { userVote: data?.vote_type || null }
  } catch (error) {
    console.error('Error in getUserVote:', error)
    return { userVote: null }
  }
} 