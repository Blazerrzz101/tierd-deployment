"use client"; // Mark as Client Component

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase/client"; // Updated import path

export default function LiveUpdates() {
  const [reviewsCount, setReviewsCount] = useState(0);
  const [votesCount, setVotesCount] = useState(0);

  useEffect(() => {
    // Fetch initial data
    const fetchCounts = async () => {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("*", { count: "exact" });

      const { data: votesData, error: votesError } = await supabase
        .from("votes")
        .select("*", { count: "exact" });

      if (!reviewsError) setReviewsCount(reviewsData?.length || 0);
      if (!votesError) setVotesCount(votesData?.length || 0);
    };

    fetchCounts();

    // Listen for changes in reviews
    const reviewsSubscription = supabase
      .channel("reviews")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews" },
        () => fetchCounts()
      )
      .subscribe();

    // Listen for changes in votes
    const votesSubscription = supabase
      .channel("votes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes" },
        () => fetchCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reviewsSubscription);
      supabase.removeChannel(votesSubscription);
    };
  }, []);

  return (
    <div>
      <p>Live Reviews: {reviewsCount}</p>
      <p>Live Votes: {votesCount}</p>
    </div>
  );
}
