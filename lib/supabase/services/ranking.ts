import { supabase } from '../client';
import { validateVote, validateRankingData, calculateHotScore } from '../middleware';
import { DatabaseError, DatabaseErrorType } from '../errors';
import { User } from '@supabase/supabase-js';

interface RankingData {
  id: string;
  name: string;
  upvotes: number;
  downvotes: number;
  net_score: number;
  rank: number;
  created_at: string;
}

type VoteType = 'up' | 'down' | null;

/**
 * Update product rankings by refreshing the materialized view
 */
export async function updateProductRankings() {
  try {
    const { data, error } = await supabase.rpc('refresh_product_rankings');
    
    if (error) {
      console.error('Ranking update failed:', error);
      throw new DatabaseError(
        DatabaseErrorType.OPERATION_FAILED,
        'Failed to update product rankings',
        error
      );
    }
    
    return data;
  } catch (error) {
    throw new DatabaseError(
      DatabaseErrorType.UNKNOWN,
      'Failed to update rankings',
      error
    );
  }
}

/**
 * Get hot products sorted by score
 */
export async function getHotProducts(limit = 100) {
  try {
    const { data, error } = await supabase
      .from('product_rankings')
      .select('*')
      .order('net_score', { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseError(
        DatabaseErrorType.QUERY_FAILED,
        'Failed to fetch hot products',
        error
      );
    }

    // Validate and transform each ranking
    return data?.map(item => {
      validateRankingData(item);
      return {
        ...item,
        hot_score: calculateHotScore(
          item.upvotes,
          item.downvotes,
          new Date(item.created_at)
        )
      };
    });
  } catch (error) {
    throw new DatabaseError(
      DatabaseErrorType.UNKNOWN,
      'Failed to get hot products',
      error
    );
  }
}

/**
 * Cast a vote on a product
 */
export async function castVote(productId: string, voteType: VoteType) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to vote');
    }

    // Start a transaction
    const { data: client } = await supabase.rpc('begin_transaction');

    try {
      // Get the user's previous vote if it exists
      const { data: previousVote } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .single();

      // If the user is clicking the same vote type, remove their vote
      if (previousVote?.vote_type === (voteType === 'up' ? 1 : -1)) {
        // Delete the vote
        await supabase
          .from('votes')
          .delete()
          .eq('product_id', productId)
          .eq('user_id', user.id);

        // Update last_vote_timestamp
        await supabase
          .from('products')
          .update({ last_vote_timestamp: new Date().toISOString() })
          .eq('id', productId);

        // Commit transaction
        await supabase.rpc('commit_transaction');

        // Refresh rankings
        await supabase.rpc('refresh_product_rankings');

        return null;
      }

      // Otherwise, update or insert the new vote
      const voteValue = voteType === 'up' ? 1 : -1;
      const { data, error } = await supabase
        .from('votes')
        .upsert({
          product_id: productId,
          user_id: user.id,
          vote_type: voteValue,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'product_id,user_id'
        });

      if (error) throw error;

      // Update last_vote_timestamp
      await supabase
        .from('products')
        .update({ last_vote_timestamp: new Date().toISOString() })
        .eq('id', productId);

      // Commit transaction
      await supabase.rpc('commit_transaction');

      // Refresh rankings
      await supabase.rpc('refresh_product_rankings');

      return data;
    } catch (error) {
      // Rollback on error
      await supabase.rpc('rollback_transaction');
      throw error;
    }
  } catch (error) {
    throw new DatabaseError(
      DatabaseErrorType.OPERATION_FAILED,
      'Failed to cast vote',
      error
    );
  }
}

/**
 * Get user's vote for a product
 */
export async function getUserVote(productId: string): Promise<VoteType | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('product_id', productId)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      throw new DatabaseError(
        DatabaseErrorType.QUERY_FAILED,
        'Failed to fetch user vote',
        error
      );
    }

    // Convert numeric vote type to string type
    if (data?.vote_type === 1) return 'up';
    if (data?.vote_type === -1) return 'down';
    return null;
  } catch (error) {
    throw new DatabaseError(
      DatabaseErrorType.UNKNOWN,
      'Failed to get user vote',
      error
    );
  }
} 