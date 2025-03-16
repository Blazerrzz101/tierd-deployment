'use client';

import { useState, useEffect } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { castVote, getUserVote } from '@/lib/supabase/services/ranking';
import { cn } from '@/lib/utils';

interface ProductVoteProps {
  productId: string;
  initialVoteType?: number | null;
  className?: string;
}

export function ProductVote({ productId, initialVoteType = null, className }: ProductVoteProps) {
  const [voteType, setVoteType] = useState<number | null>(initialVoteType);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserVote() {
      try {
        const vote = await getUserVote(productId);
        setVoteType(vote);
      } catch (err) {
        console.error('Failed to fetch user vote:', err);
      }
    }

    if (initialVoteType === null) {
      fetchUserVote();
    }
  }, [productId, initialVoteType]);

  const handleVote = async (newVoteType: number) => {
    try {
      setIsLoading(true);
      setError(null);

      // If clicking the same vote type, remove the vote
      const finalVoteType = newVoteType === voteType ? 0 : newVoteType;
      
      await castVote(productId, finalVoteType);
      setVoteType(finalVoteType);
    } catch (err) {
      console.error('Failed to cast vote:', err);
      setError(err instanceof Error ? err.message : 'Failed to cast vote');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <button
        onClick={() => !isLoading && handleVote(1)}
        disabled={isLoading}
        className={cn(
          'p-1 rounded-full transition-colors',
          voteType === 1 ? 'text-green-600 bg-green-50' : 'hover:bg-gray-100',
          isLoading && 'opacity-50 cursor-not-allowed'
        )}
        aria-label="Upvote"
      >
        <ArrowUpIcon className="w-6 h-6" />
      </button>

      <button
        onClick={() => !isLoading && handleVote(-1)}
        disabled={isLoading}
        className={cn(
          'p-1 rounded-full transition-colors',
          voteType === -1 ? 'text-red-600 bg-red-50' : 'hover:bg-gray-100',
          isLoading && 'opacity-50 cursor-not-allowed'
        )}
        aria-label="Downvote"
      >
        <ArrowDownIcon className="w-6 h-6" />
      </button>

      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
} 