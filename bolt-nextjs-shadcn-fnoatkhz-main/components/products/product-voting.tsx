import { logActivity } from '../../lib/api';

export default function ProductVoting({ productId, productName, userId }) {
  async function handleVote(action) {
    try {
      await logActivity(userId, 'vote', productId, productName, action);
      alert(`You voted: ${action}`);
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  return (
    <div>
      <h2>Vote for {productName}</h2>
      <button onClick={() => handleVote('upvote')}>Upvote</button>
      <button onClick={() => handleVote('downvote')}>Downvote</button>
    </div>
  );
}
