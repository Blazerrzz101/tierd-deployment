import { supabase } from './client'
import type { Thread } from '@/types/thread'
import { DatabaseError, DatabaseErrorType } from './error-handling'

export class ThreadManager {
  static async getThreadsForProduct(productId: string): Promise<Thread[]> {
    try {
      const { data: threads, error } = await supabase
        .from('threads')
        .select(`
          *,
          user:user_profiles (
            id,
            display_name,
            avatar_url
          ),
          votes:thread_votes (
            id,
            type
          ),
          mentions:thread_mentions (
            product_id
          )
        `)
        .eq('mentions.product_id', productId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new DatabaseError(
          DatabaseErrorType.QUERY_FAILED,
          'Failed to fetch threads',
          error
        )
      }

      return threads || []
    } catch (error) {
      console.error('Error in getThreadsForProduct:', error)
      throw error
    }
  }

  static async createThread(
    content: string,
    userId: string,
    mentionedProductIds: string[]
  ): Promise<Thread> {
    try {
      // Start a Supabase transaction
      const { data: thread, error: threadError } = await supabase
        .from('threads')
        .insert([
          {
            content,
            user_id: userId,
            mentioned_products: mentionedProductIds
          }
        ])
        .select()
        .single()

      if (threadError) {
        throw new DatabaseError(
          DatabaseErrorType.QUERY_FAILED,
          'Failed to create thread',
          threadError
        )
      }

      // Create thread-product relationships
      if (mentionedProductIds.length > 0) {
        const { error: mentionsError } = await supabase
          .from('thread_mentions')
          .insert(
            mentionedProductIds.map(productId => ({
              thread_id: thread.id,
              product_id: productId
            }))
          )

        if (mentionsError) {
          // Attempt to rollback thread creation
          await supabase
            .from('threads')
            .delete()
            .eq('id', thread.id)

          throw new DatabaseError(
            DatabaseErrorType.QUERY_FAILED,
            'Failed to create product mentions',
            mentionsError
          )
        }
      }

      return thread
    } catch (error) {
      console.error('Error in createThread:', error)
      throw error
    }
  }

  static async getThreadById(threadId: string): Promise<Thread | null> {
    try {
      const { data: thread, error } = await supabase
        .from('threads')
        .select(`
          *,
          user:user_profiles (
            id,
            display_name,
            avatar_url
          ),
          votes:thread_votes (
            id,
            type
          ),
          mentions:thread_mentions (
            product:products (
              id,
              name,
              url_slug,
              category
            )
          )
        `)
        .eq('id', threadId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw new DatabaseError(
          DatabaseErrorType.QUERY_FAILED,
          'Failed to fetch thread',
          error
        )
      }

      return thread
    } catch (error) {
      console.error('Error in getThreadById:', error)
      throw error
    }
  }

  static async updateThread(
    threadId: string,
    content: string,
    mentionedProductIds: string[]
  ): Promise<Thread> {
    try {
      // Update thread content
      const { data: thread, error: threadError } = await supabase
        .from('threads')
        .update({ content })
        .eq('id', threadId)
        .select()
        .single()

      if (threadError) {
        throw new DatabaseError(
          DatabaseErrorType.QUERY_FAILED,
          'Failed to update thread',
          threadError
        )
      }

      // Update product mentions
      const { error: deleteMentionsError } = await supabase
        .from('thread_mentions')
        .delete()
        .eq('thread_id', threadId)

      if (deleteMentionsError) {
        throw new DatabaseError(
          DatabaseErrorType.QUERY_FAILED,
          'Failed to update product mentions',
          deleteMentionsError
        )
      }

      if (mentionedProductIds.length > 0) {
        const { error: insertMentionsError } = await supabase
          .from('thread_mentions')
          .insert(
            mentionedProductIds.map(productId => ({
              thread_id: threadId,
              product_id: productId
            }))
          )

        if (insertMentionsError) {
          throw new DatabaseError(
            DatabaseErrorType.QUERY_FAILED,
            'Failed to update product mentions',
            insertMentionsError
          )
        }
      }

      return thread
    } catch (error) {
      console.error('Error in updateThread:', error)
      throw error
    }
  }

  static async deleteThread(threadId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('threads')
        .delete()
        .eq('id', threadId)

      if (error) {
        throw new DatabaseError(
          DatabaseErrorType.QUERY_FAILED,
          'Failed to delete thread',
          error
        )
      }
    } catch (error) {
      console.error('Error in deleteThread:', error)
      throw error
    }
  }
} 