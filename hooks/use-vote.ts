"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import type { VoteType } from '@/types/vote';

const ANONYMOUS_VOTE_LIMIT = 5;
const ANONYMOUS_VOTE_KEY = 'anonymous_votes';

interface AnonymousVote {
  productId: string;
  voteType: VoteType;
  timestamp: number;
}

export function useVote() {
  const [isLoading, setIsLoading] = useState(false);
  const [anonymousVotes, setAnonymousVotes] = useState<AnonymousVote[]>([]);

  // Load anonymous votes from localStorage on mount
  useEffect(() => {
    const savedVotes = localStorage.getItem(ANONYMOUS_VOTE_KEY);
    if (savedVotes) {
      try {
        setAnonymousVotes(JSON.parse(savedVotes));
      } catch (error) {
        console.error('Error loading anonymous votes:', error);
        localStorage.removeItem(ANONYMOUS_VOTE_KEY);
      }
    }
  }, []);

  // Save anonymous votes to localStorage
  const saveAnonymousVotes = (votes: AnonymousVote[]) => {
    try {
      localStorage.setItem(ANONYMOUS_VOTE_KEY, JSON.stringify(votes));
      setAnonymousVotes(votes);
    } catch (error) {
      console.error('Error saving anonymous votes:', error);
    }
  };

  // Check if user has reached anonymous vote limit
  const hasReachedAnonymousLimit = () => {
    // Clean up old votes (older than 24 hours)
    const now = Date.now();
    const recentVotes = anonymousVotes.filter(
      vote => now - vote.timestamp < 24 * 60 * 60 * 1000
    );

    if (recentVotes.length !== anonymousVotes.length) {
      saveAnonymousVotes(recentVotes);
    }

    return recentVotes.length >= ANONYMOUS_VOTE_LIMIT;
  };

  const vote = async (productId: string, voteType: VoteType) => {
    try {
      setIsLoading(true);

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Handle anonymous voting
        if (hasReachedAnonymousLimit()) {
          toast.error("Vote Limit Reached", {
            description: "You've reached the limit of 5 anonymous votes per day. Please sign in to continue voting.",
            action: {
              label: "Sign In",
              onClick: () => window.location.href = "/auth/signin"
            }
          });
          return;
        }

        // Check if user has already voted on this product
        const existingVoteIndex = anonymousVotes.findIndex(v => v.productId === productId);
        
        if (existingVoteIndex !== -1) {
          const existingVote = anonymousVotes[existingVoteIndex];
          
          if (existingVote.voteType === voteType) {
            // Remove vote if clicking the same button
            const newVotes = anonymousVotes.filter((_, i) => i !== existingVoteIndex);
            saveAnonymousVotes(newVotes);
            
            // Update database
            await supabase
              .from('votes')
              .delete()
              .match({ product_id: productId, user_id: 'anonymous' });

            toast.success("Anonymous Vote Removed");
          } else {
            // Update vote if changing from up to down or vice versa
            const newVotes = [...anonymousVotes];
            newVotes[existingVoteIndex] = {
              ...existingVote,
              voteType,
              timestamp: Date.now()
            };
            saveAnonymousVotes(newVotes);
            
            // Update database
            await supabase
              .from('votes')
              .update({ vote_type: voteType })
              .match({ product_id: productId, user_id: 'anonymous' });

            toast.success("Anonymous Vote Updated");
          }
        } else {
          // Add new anonymous vote
          const newVote: AnonymousVote = {
            productId,
            voteType,
            timestamp: Date.now()
          };
          saveAnonymousVotes([...anonymousVotes, newVote]);
          
          // Update database
          await supabase
            .from('votes')
            .insert({
              product_id: productId,
              user_id: 'anonymous',
              vote_type: voteType,
              created_at: new Date().toISOString()
            });

          toast.success("Anonymous Vote Recorded", {
            description: "Sign in to make your votes permanent!",
            action: {
              label: "Sign In",
              onClick: () => window.location.href = "/auth/signin"
            }
          });
        }
      } else {
        // Handle authenticated voting
        const { data: existingVote } = await supabase
          .from('votes')
          .select('id, vote_type')
          .eq('product_id', productId)
          .eq('user_id', session.user.id)
          .single();

        if (existingVote) {
          if (existingVote.vote_type === voteType) {
            // Remove vote if clicking the same button
            const { error } = await supabase
              .from('votes')
              .delete()
              .eq('id', existingVote.id);

            if (error) throw error;

            toast.success("Vote Removed");
          } else {
            // Update vote if changing from up to down or vice versa
            const { error } = await supabase
              .from('votes')
              .update({ vote_type: voteType })
              .eq('id', existingVote.id);

            if (error) throw error;

            toast.success("Vote Updated");
          }
        } else {
          // Create new vote
          const { error } = await supabase
            .from('votes')
            .insert({
              product_id: productId,
              user_id: session.user.id,
              vote_type: voteType,
              created_at: new Date().toISOString()
            });

          if (error) throw error;

          toast.success("Vote Recorded");
        }
      }

      // Refresh the product rankings
      await supabase.rpc('refresh_product_rankings');

    } catch (error: any) {
      console.error('Error voting:', error);
      toast.error("Error", {
        description: error.message || "There was a problem recording your vote. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to claim anonymous votes after signing in
  const claimAnonymousVotes = async (userId: string) => {
    try {
      const { data: existingVotes, error: fetchError } = await supabase
        .from('votes')
        .select('product_id, vote_type')
        .eq('user_id', 'anonymous');

      if (fetchError) throw fetchError;

      if (existingVotes && existingVotes.length > 0) {
        // Update all anonymous votes to the user's ID
        const { error: updateError } = await supabase
          .from('votes')
          .update({ user_id: userId })
          .eq('user_id', 'anonymous');

        if (updateError) throw updateError;

        // Clear anonymous votes from localStorage
        localStorage.removeItem(ANONYMOUS_VOTE_KEY);
        setAnonymousVotes([]);

        toast.success("Anonymous Votes Claimed", {
          description: `Successfully claimed ${existingVotes.length} anonymous votes!`
        });
      }
    } catch (error: any) {
      console.error('Error claiming anonymous votes:', error);
      toast.error("Error claiming votes", {
        description: error.message || "Failed to claim anonymous votes"
      });
    }
  };

  return {
    vote,
    claimAnonymousVotes,
    isLoading,
    anonymousVoteCount: anonymousVotes.length
  };
}
