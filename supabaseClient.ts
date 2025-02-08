import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log('Initializing Supabase client with URL:', supabaseUrl);
export const supabase = createClient(supabaseUrl, supabaseKey);

export function subscribeToRealtimeUpdates({ onVoteChange, onReviewChange }) {
  console.log('Setting up real-time subscriptions');
  
  // Create a channel for votes
  const votesChannel = supabase
    .channel('votes-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'votes'
      },
      (payload) => {
        console.log('Vote change detected:', payload);
        onVoteChange(payload.new);
      }
    )
    .subscribe();

  // Create a channel for reviews
  const reviewsChannel = supabase
    .channel('reviews-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'reviews'
      },
      (payload) => {
        console.log('Review change detected:', payload);
        onReviewChange(payload.new);
      }
    )
    .subscribe();

  console.log('Real-time subscriptions set up successfully');

  // Return cleanup function
  return () => {
    console.log('Cleaning up real-time subscriptions');
    supabase.removeChannel(votesChannel);
    supabase.removeChannel(reviewsChannel);
  };
}
