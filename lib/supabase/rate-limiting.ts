import { supabase } from './client';
import { DatabaseError, DatabaseErrorType } from './error-handling';

interface RateLimitConfig {
  maxAttempts: number;
  windowSeconds: number;
}

const RATE_LIMITS = {
  REVIEWS: {
    maxAttempts: 3,
    windowSeconds: 24 * 60 * 60 // 24 hours
  },
  VOTES: {
    maxAttempts: 50,
    windowSeconds: 60 * 60 // 1 hour
  },
  PRODUCT_REVIEWS: {
    maxAttempts: 1,
    windowSeconds: 24 * 60 * 60 // 24 hours
  }
} as const;

async function checkRateLimit(
  userId: string,
  actionType: string,
  config: RateLimitConfig
): Promise<void> {
  const windowStart = new Date(Date.now() - config.windowSeconds * 1000).toISOString();
  
  // Get recent attempts
  const { data: attempts, error } = await supabase
    .from('rate_limits')
    .select('created_at')
    .eq('user_id', userId)
    .eq('action_type', actionType)
    .gte('created_at', windowStart);

  if (error) {
    throw new DatabaseError(
      DatabaseErrorType.QUERY_FAILED,
      'Failed to check rate limit',
      error
    );
  }

  if (attempts && attempts.length >= config.maxAttempts) {
    throw new DatabaseError(
      DatabaseErrorType.RATE_LIMIT,
      `Rate limit exceeded for ${actionType}. Please try again later.`
    );
  }
}

async function recordAttempt(
  userId: string,
  actionType: string,
  metadata?: Record<string, any>
): Promise<void> {
  const { error } = await supabase
    .from('rate_limits')
    .insert({
      user_id: userId,
      action_type: actionType,
      metadata,
      created_at: new Date().toISOString()
    });

  if (error) {
    throw new DatabaseError(
      DatabaseErrorType.OPERATION_FAILED,
      'Failed to record rate limit attempt',
      error
    );
  }
}

export async function checkReviewRateLimit(userId: string): Promise<void> {
  await checkRateLimit(userId, 'review', RATE_LIMITS.REVIEWS);
}

export async function checkProductReviewRateLimit(
  userId: string,
  productId: string
): Promise<void> {
  // Check product-specific review limit
  const windowStart = new Date(
    Date.now() - RATE_LIMITS.PRODUCT_REVIEWS.windowSeconds * 1000
  ).toISOString();

  const { data: existingReviews, error } = await supabase
    .from('reviews')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .gte('created_at', windowStart)
    .limit(1);

  if (error) {
    throw new DatabaseError(
      DatabaseErrorType.QUERY_FAILED,
      'Failed to check product review limit',
      error
    );
  }

  if (existingReviews && existingReviews.length > 0) {
    throw new DatabaseError(
      DatabaseErrorType.RATE_LIMIT,
      'You can only review this product once every 24 hours'
    );
  }
}

export async function checkVoteRateLimit(userId: string): Promise<void> {
  await checkRateLimit(userId, 'vote', RATE_LIMITS.VOTES);
}

export async function recordReviewAttempt(
  userId: string,
  productId: string
): Promise<void> {
  await recordAttempt(userId, 'review', { product_id: productId });
}

export async function recordVoteAttempt(
  userId: string,
  productId: string,
  voteType: string
): Promise<void> {
  await recordAttempt(userId, 'vote', { 
    product_id: productId,
    vote_type: voteType
  });
}

// Create necessary database objects
export async function setupRateLimiting(): Promise<void> {
  // Create rate_limits table if it doesn't exist
  const { error: tableError } = await supabase.rpc('create_rate_limits_table');
  
  if (tableError) {
    throw new DatabaseError(
      DatabaseErrorType.OPERATION_FAILED,
      'Failed to create rate limiting table',
      tableError
    );
  }

  // Create cleanup function
  const { error: functionError } = await supabase.rpc('create_rate_limit_cleanup');
  
  if (functionError) {
    throw new DatabaseError(
      DatabaseErrorType.OPERATION_FAILED,
      'Failed to create rate limit cleanup function',
      functionError
    );
  }
} 