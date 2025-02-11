import { createClient } from '@supabase/supabase-js';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log('Initializing Supabase client with URL:', supabaseUrl);
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Types for realtime updates
type VoteChange = Database['public']['Tables']['votes']['Row'];
type ThreadChange = Database['public']['Tables']['threads']['Row'];
type ProductMention = Database['public']['Tables']['product_mentions']['Row'];

interface RealtimeHandlers {
  onVoteChange?: (payload: VoteChange) => void;
  onThreadChange?: (payload: ThreadChange) => void;
  onProductMention?: (payload: ProductMention) => void;
}

// Helper to log realtime events
function logRealtimeEvent(context: string, payload: any) {
  console.log(`Realtime ${context}:`, {
    event: payload.eventType,
    table: payload.table,
    schema: payload.schema,
    timestamp: new Date().toISOString()
  });
}

// Helper to handle subscription errors
function handleSubscriptionError(context: string, error: any) {
  console.error(`Realtime ${context} error:`, {
    message: error.message,
    code: error.code,
    timestamp: new Date().toISOString()
  });
}

export function subscribeToRealtimeUpdates(handlers: RealtimeHandlers) {
  const channels: RealtimeChannel[] = [];
  console.log('Setting up real-time subscriptions');

  try {
    // Create a channel for votes
    if (handlers.onVoteChange) {
      const votesChannel = supabase
        .channel('votes-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'votes'
          },
          (payload: RealtimePostgresChangesPayload<VoteChange>) => {
            logRealtimeEvent('vote', payload);
            handlers.onVoteChange?.(payload.new);
          }
        )
        .subscribe((status) => {
          console.log('Votes subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to votes changes');
          }
        });

      channels.push(votesChannel);
    }

    // Create a channel for threads
    if (handlers.onThreadChange) {
      const threadsChannel = supabase
        .channel('threads-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'threads'
          },
          (payload: RealtimePostgresChangesPayload<ThreadChange>) => {
            logRealtimeEvent('thread', payload);
            handlers.onThreadChange?.(payload.new);
          }
        )
        .subscribe((status) => {
          console.log('Threads subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to thread changes');
          }
        });

      channels.push(threadsChannel);
    }

    // Create a channel for product mentions
    if (handlers.onProductMention) {
      const mentionsChannel = supabase
        .channel('mentions-channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'product_mentions'
          },
          (payload: RealtimePostgresChangesPayload<ProductMention>) => {
            logRealtimeEvent('product mention', payload);
            handlers.onProductMention?.(payload.new);
          }
        )
        .subscribe((status) => {
          console.log('Product mentions subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to product mention changes');
          }
        });

      channels.push(mentionsChannel);
    }

    console.log('Real-time subscriptions set up successfully');

    // Return cleanup function
    return () => {
      console.log('Cleaning up real-time subscriptions');
      channels.forEach(channel => {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          handleSubscriptionError('cleanup', error);
        }
      });
    };
  } catch (error) {
    handleSubscriptionError('setup', error);
    // Return a no-op cleanup function
    return () => {};
  }
}

// Helper function to parse @ mentions from text
export function parseProductMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions = text.match(mentionRegex);
  return mentions ? mentions.map(m => m.slice(1)) : [];
}

// Function to handle product mentions in a thread
export async function handleProductMentions(
  threadId: string,
  text: string
): Promise<void> {
  try {
    const mentions = parseProductMentions(text);
    
    if (mentions.length === 0) return;

    // Look up products by name
    const { data: products, error: lookupError } = await supabase
      .from('products')
      .select('id, name')
      .in('name', mentions);

    if (lookupError) throw lookupError;

    if (!products || products.length === 0) return;

    // Insert product mentions
    const { error: insertError } = await supabase
      .from('product_mentions')
      .insert(
        products.map(product => ({
          thread_id: threadId,
          product_id: product.id,
          created_at: new Date().toISOString()
        }))
      );

    if (insertError) throw insertError;

    console.log(`Added ${products.length} product mentions to thread ${threadId}`);
  } catch (error) {
    console.error('Error handling product mentions:', error);
    throw error;
  }
}
