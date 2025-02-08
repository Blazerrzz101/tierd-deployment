import React, { useState } from 'react';
import { supabase } from '@/supabaseClient';

interface ProductCardProps {
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ productId, productName, productPrice, productImage }) => {
  const [voteCount, setVoteCount] = useState<number>(0);

  const handleVote = async (type: 'upvote' | 'downvote') => {
    setVoteCount(type === 'upvote' ? voteCount + 1 : voteCount - 1);
    console.log(`${type} registered for product ${productId}`);

    // API call to persist the vote
    const { error } = await supabase
      .from('votes')
      .insert([{ product_id: productId, vote_type: type === 'upvote' ? 'up' : 'down' }]);

    if (error) {
      console.error('Error submitting vote:', error.message);
    }
  };

  return (
    <div className="product-card">
      <img src={productImage} alt={productName} className="product-image" />
      <h2>{productName}</h2>
      <p>${productPrice.toFixed(2)}</p>
      <div className="vote-section">
        <button onClick={() => handleVote('upvote')}>Upvote</button>
        <span>{voteCount} votes</span>
        <button onClick={() => handleVote('downvote')}>Downvote</button>
      </div>
    </div>
  );
};

export default ProductCard;