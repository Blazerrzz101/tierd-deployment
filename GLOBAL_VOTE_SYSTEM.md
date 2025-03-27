# Global Vote System Documentation

## Overview

The global vote system is a comprehensive solution that ensures vote consistency across different parts of the application. It uses React Query to maintain a centralized cache of vote statuses, eliminating inconsistencies between different components displaying the same product.

## Key Components

### 1. `useGlobalVotes` Hook

The central hook that provides vote-related functionality:

```javascript
// hooks/use-global-votes.ts
export function useGlobalVotes() {
  // Provides:
  return {
    useProductVoteStatus, // Query hook to get vote status for a product
    useVoteMutation,      // Mutation hook to vote for a product
    fetchVoteStatus,      // Direct method to fetch vote status
    submitVote,           // Direct method to submit a vote
    invalidateProductVote, // Helper to refresh vote cache for a product
    invalidateAllVotes     // Helper to refresh all vote caches
  };
}
```

### 2. `ProductVoteWrapper` Component

A wrapper component that provides consistent vote data to its children:

```jsx
// components/products/product-vote-wrapper.tsx
<ProductVoteWrapper product={product}>
  {(voteData) => (
    // Access to consistent vote data
    <div>
      Score: {voteData.score}
      Upvotes: {voteData.upvotes}
      Downvotes: {voteData.downvotes}
      Your vote: {voteData.voteType}
    </div>
  )}
</ProductVoteWrapper>
```

### 3. `GlobalVoteButtons` Component

Reusable UI component for voting that ties into the global system:

```jsx
// components/products/global-vote-buttons.tsx
<GlobalVoteButtons 
  product={{ id: "123", name: "Product Name" }} 
  className="my-4" 
/>
```

## Vote API Endpoints

### GET /api/vote
Gets the current vote status for a product.

**Parameters:**
- `productId` (required): ID of the product
- `clientId` (optional): Client ID for identifying the voter

**Headers:**
- `X-Client-ID` (optional): Alternative way to provide the client ID

**Response:**
```json
{
  "success": true,
  "productId": "123",
  "voteType": 1,      // 1 = upvote, -1 = downvote, null = no vote
  "upvotes": 10,
  "downvotes": 3,
  "score": 7,
  "hasVoted": true
}
```

### POST /api/vote
Submits a vote for a product.

**Request body:**
```json
{
  "productId": "123",
  "clientId": "abc123",
  "voteType": 1      // 1 = upvote, -1 = downvote, null = remove vote
}
```

**Headers:**
- `X-Client-ID` (optional): Alternative way to provide the client ID

**Response:**
```json
{
  "success": true,
  "productId": "123",
  "voteType": 1,
  "upvotes": 11,     // Updated count
  "downvotes": 3,
  "score": 8,
  "hasVoted": true
}
```

## Features

### Toggle Voting
- Clicking the same button twice toggles the vote (removes it)
- Clicking the opposite button changes the vote type

### Real-time Synchronization
- All instances of vote UI for the same product update simultaneously
- React Query invalidation ensures data freshness

### Fallback Mechanisms
- The system includes fallbacks for different client ID sources
- Local file storage serves as a backup when the database is unavailable

## Testing

### Test Script
A Node.js script is available for testing vote consistency:
```
node scripts/test-global-vote-consistency.js
```

### Test Page
A test page with multiple vote components demonstrates synchronization:
```
/test-global-votes
```

## Implementation Example

To convert components to use the global vote system:

1. Replace old vote buttons:
```diff
- <VoteButtons 
-   product={product}
-   initialUpvotes={product.upvotes}
-   initialDownvotes={product.downvotes}
-   initialVoteType={product.userVote}
- />
+ <ProductVoteWrapper product={product}>
+   {(voteData) => (
+     <GlobalVoteButtons product={product} />
+   )}
+ </ProductVoteWrapper>
```

2. Access vote data directly:
```jsx
<ProductVoteWrapper product={product}>
  {(voteData) => (
    <div>
      {/* Use voteData.upvotes, voteData.downvotes, voteData.score, etc. */}
      <div>Total votes: {voteData.upvotes + voteData.downvotes}</div>
      <div>Score: {voteData.score}</div>
      <GlobalVoteButtons product={product} />
    </div>
  )}
</ProductVoteWrapper>
```

## Benefits

1. **Consistency**: Votes are consistent across all components
2. **Performance**: Reduced API calls through shared cache
3. **User Experience**: Real-time updates without page refreshes
4. **Maintainability**: Centralized logic for easier updates
5. **Error Handling**: Improved error reporting and fallbacks 