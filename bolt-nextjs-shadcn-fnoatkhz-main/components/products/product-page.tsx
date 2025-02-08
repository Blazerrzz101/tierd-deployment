import { useState, useEffect } from 'react';
import { subscribeToRealtimeUpdates } from '../../supabaseClient';

export default function ProductPage() {
  const [products, setProducts] = useState([]);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [votesCount, setVotesCount] = useState(0);

  useEffect(() => {
    // Function to fetch products
    async function fetchProducts() {
      const response = await fetch('/api/products');
      const { data } = await response.json();
      setProducts(data);

      // Update counts
      const totalReviews = data.reduce((acc, product) => acc + (product.reviews?.length || 0), 0);
      const totalVotes = data.reduce((acc, product) => acc + (product.votes?.length || 0), 0);

      setReviewsCount(totalReviews);
      setVotesCount(totalVotes);
    }

    // Function to handle vote changes
    function handleVoteChange(newVote) {
      console.log('Vote added or updated:', newVote);
      fetchProducts(); // Refetch to update rankings and counts
    }

    // Function to handle review changes
    function handleReviewChange(newReview) {
      console.log('Review added:', newReview);
      fetchProducts(); // Refetch to update rankings and counts
    }

    // Subscribe to real-time updates
    const unsubscribe = subscribeToRealtimeUpdates({
      onVoteChange: handleVoteChange,
      onReviewChange: handleReviewChange,
    });

    // Fetch initial products
    fetchProducts();

    // Clean up subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <div>
      <h1>Product Rankings</h1>
      <p>Total Reviews: {reviewsCount}</p>
      <p>Total Votes: {votesCount}</p>
      {products.map((product) => (
        <div key={product.id}>
          <h2>{product.name}</h2>
          <p>Ranking: {product.ranking}</p>
          <p>Votes: {product.votes ? product.votes.length : 0}</p>
          <p>Reviews: {product.reviews ? product.reviews.length : 0}</p>
        </div>
      ))}
    </div>
  );
}
