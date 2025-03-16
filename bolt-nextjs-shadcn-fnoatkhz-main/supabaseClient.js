import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Realtime subscriptions for votes and reviews
export function subscribeToRealtimeUpdates({ onVoteChange, onReviewChange }) {
  // Listen for changes in the votes table
  const votesSubscription = supabase
    .from('votes')
    .on('INSERT', payload => onVoteChange(payload.new))
    .on('UPDATE', payload => onVoteChange(payload.new))
    .subscribe();

  // Listen for changes in the reviews table
  const reviewsSubscription = supabase
    .from('reviews')
    .on('INSERT', payload => onReviewChange(payload.new))
    .subscribe();

  return () => {
    supabase.removeSubscription(votesSubscription);
    supabase.removeSubscription(reviewsSubscription);
  };
}
