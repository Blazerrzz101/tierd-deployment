# Tier'd Voting System Documentation

## Overview

The Tier'd voting system enables users to upvote or downvote products, with results reflected in real-time product rankings. Our implementation balances user engagement with data integrity through a robust, scalable architecture.

## Key Features

### User Types and Vote Limitations
- **Anonymous Users**: Limited to 5 votes per hour (to prevent abuse)
- **Authenticated Users**: Unlimited voting capability
- **Vote Persistence**: Anonymous votes are linked to user accounts upon sign-up

### Vote Actions
- **Upvote**: Increase a product's ranking
- **Downvote**: Decrease a product's ranking
- **Toggle Vote**: Clicking the same vote type twice removes the vote
- **Change Vote**: Switching from upvote to downvote (or vice versa)

### Product Ranking
- Products are ranked based on their score (upvotes - downvotes)
- Rankings update in real-time as votes are cast
- Ties are broken by total vote count, then alphabetically by name

## Technical Implementation

### Frontend Components
- **VoteButtons Component**: Displays upvote/downvote buttons with optimistic UI updates
- **Enhanced Auth Provider**: Tracks user authentication state and remaining votes for anonymous users
- **Vote Hook**: Manages client-side vote state and API interactions

### API Endpoints
- **POST /api/vote**: Submit votes with rate limiting for anonymous users
- **GET /api/vote**: Check current vote status for a product
- **GET /api/vote/remaining-votes**: Check remaining votes for anonymous users
- **POST /api/vote/link-anonymous-votes**: Link anonymous votes to a user account upon sign-up

### Data Storage
The voting system currently uses in-memory storage for the mock implementation:

```
VoteState {
  votes: Record<string, number>, // key is "clientId:productId", value is voteType
  voteCounts: Record<string, { upvotes: number, downvotes: number }>,
  lastUpdated: string
}
```

For production, this will be migrated to our Supabase database with the schema defined in `lib/supabase/schema.sql`.

## Testing

### Test Page
A dedicated test page is available at `/test-vote` for verifying voting functionality, with features:
- Vote interface for multiple test products
- Authentication controls for testing both anonymous and signed-in states
- API response display for debugging

### API Testing Commands
Test the voting API directly:

```bash
# Check vote status
curl "http://localhost:3001/api/vote?productId=9dd2bfe2-6eef-40de-ae12-c35ff1975914&clientId=test-client"

# Cast a vote
curl -X POST "http://localhost:3001/api/vote" \
  -H "Content-Type: application/json" \
  -d '{"productId":"9dd2bfe2-6eef-40de-ae12-c35ff1975914","voteType":1,"clientId":"test-client"}'
```

### Common Edge Cases Handled
- **Duplicate Votes**: System prevents double-voting (toggles instead)
- **Vote Type Change**: From upvote to downvote or vice versa
- **Rate Limiting**: Anonymous users receive clear feedback when limit is reached
- **Anonymous → Authenticated**: Votes persist when users create an account
- **Missing Products**: Graceful handling when voting for non-existent products

## Maintenance

### Vote Count Repair Tool
The system includes a maintenance script to fix any inconsistencies in vote counts:

```bash
# Run in dry-run mode to check discrepancies without fixing
node scripts/fix-vote-counts.js --dry-run

# Fix discrepancies
node scripts/fix-vote-counts.js
```

## Usage Example

```tsx
// Using the voting system in a React component
import { useVote } from "@/hooks/use-vote";
import { VoteButtons } from "@/components/products/vote-buttons";

function ProductCard({ product }) {
  const { vote, voteStatus } = useVote();
  
  // Display vote buttons with current state
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <VoteButtons 
        product={product}
        initialUpvotes={product.upvotes}
        initialDownvotes={product.downvotes}
        initialVoteType={product.userVote}
      />
    </div>
  );
}
```

## Future Improvements

- **Database Integration**: Move from mock implementation to Supabase database
- **Vote History**: Allow users to view their voting history
- **Trending Products**: Calculate trending products based on recent vote activity
- **Vote Analytics**: Admin dashboard with voting patterns and insights
- **Admin Controls**: Allow admins to moderate suspicious voting activity
- **Weighted Voting**: Give more influence to trusted users or experts

## Troubleshooting

If you encounter issues with the voting system:

1. **Inconsistent Vote Counts**: Run the fix-vote-counts.js script
2. **Rate Limit Issues**: Check anonymous user identification logic
3. **Vote Not Registering**: Verify client ID generation and storage
4. **UI Not Updating**: Check optimistic updates and revalidation logic

For developer assistance, review the implementation details in:
- `hooks/use-vote.ts` - Client-side vote management
- `app/api/vote/route.ts` - API implementation 
- `components/products/vote-buttons.tsx` - UI components

## Security Considerations

- **Rate Limiting**: Prevents vote spam from anonymous users
- **CSRF Protection**: All vote submissions require a valid client ID
- **Audit Trails**: Vote actions are stored with timestamps and metadata
- **SQL Injection Prevention**: Supabase RLS policies prevent unauthorized data access

## Performance Optimizations

- **Optimistic Updates**: UI updates immediately before API response
- **Query Invalidation**: Smart cache invalidation on vote actions
- **Batched Updates**: Vote counts are updated in batched transactions
- **Edge Caching**: Product rankings are cacheable at CDN level 