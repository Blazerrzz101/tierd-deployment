"use client"; // Mark as Client Component

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function LiveUpdates() {
  const [reviewsCount, setReviewsCount] = useState(0);
  const [votesCount, setVotesCount] = useState(0);

  useEffect(() => {
    // Fetch initial data
    const fetchCounts = async () => {
      try {
        const [reviewsResult, votesResult] = await Promise.all([
          supabase.from("reviews").select("count", { count: 'exact' }),
          supabase.from("votes").select("count", { count: 'exact' })
        ]);

        if (!reviewsResult.error) setReviewsCount(reviewsResult.count || 0);
        if (!votesResult.error) setVotesCount(votesResult.count || 0);
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };

    fetchCounts();

    // Set up real-time subscriptions
    const reviewsChannel = supabase.channel('public:reviews')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews'
        },
        async () => {
          const { count } = await supabase
            .from("reviews")
            .select("count", { count: 'exact' });
          setReviewsCount(count || 0);
        }
      )
      .subscribe();

    const votesChannel = supabase.channel('public:votes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes'
        },
        async () => {
          const { count } = await supabase
            .from("votes")
            .select("count", { count: 'exact' });
          setVotesCount(count || 0);
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(reviewsChannel);
      supabase.removeChannel(votesChannel);
    };
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
        <span className="text-sm font-medium">Live Reviews</span>
        <span className="text-sm text-muted-foreground">{reviewsCount}</span>
      </div>
      <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
        <span className="text-sm font-medium">Live Votes</span>
        <span className="text-sm text-muted-foreground">{votesCount}</span>
      </div>
    </div>
  );
}