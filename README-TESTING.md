# Testing Documentation

This document provides detailed instructions for testing the Tier'd application, with a specific focus on the voting system functionality.

## Prerequisites

- Node.js 16.x or higher
- npm 8.x or higher

## Starting the Development Server

Before running any tests, make sure the development server is running:

```bash
# Start the development server
npm run dev
```

This will start the server at http://localhost:3000 by default.

## Testing the Voting System

We have several methods to test the voting system:

### 1. Using the Test Page

The easiest way to test the voting system is by visiting the dedicated test page in your browser:

1. Start the development server: `npm run dev`
2. Open your browser and go to: `http://localhost:3000/test-vote`
3. Use the interface to test upvoting, downvoting, and checking vote status

### 2. Using the PowerShell Test Script

For automated testing on Windows, use the PowerShell script:

```powershell
# Make sure the server is running first: npm run dev
# Then in a separate terminal:
powershell -ExecutionPolicy Bypass -File scripts/Test-VoteAPI.ps1
```

### 3. Using the Node.js Test Script

For cross-platform automated testing:

```bash
# Make sure the server is running first: npm run dev
# Then in a separate terminal:
node scripts/test-vote-api.js
```

### 4. Using Direct API Calls

You can also test the API directly using curl or other HTTP clients:

```bash
# Check vote status
curl "http://localhost:3000/api/vote?productId=9dd2bfe2-6eef-40de-ae12-c35ff1975914&clientId=test-client"

# Submit upvote
curl -X POST "http://localhost:3000/api/vote" \
  -H "Content-Type: application/json" \
  -d '{"productId":"9dd2bfe2-6eef-40de-ae12-c35ff1975914","voteType":1,"clientId":"test-client"}'

# Submit downvote
curl -X POST "http://localhost:3000/api/vote" \
  -H "Content-Type: application/json" \
  -d '{"productId":"9dd2bfe2-6eef-40de-ae12-c35ff1975914","voteType":-1,"clientId":"test-client"}'

# Check remaining votes
curl "http://localhost:3000/api/vote/remaining-votes?clientId=test-client"
```

## Fixing Vote Counts

If you encounter issues with vote counts, you can run the fix script:

```bash
# Run in dry-run mode to check without making changes
node scripts/fix-vote-counts.js --dry-run

# Run to fix vote counts
node scripts/fix-vote-counts.js
```

## Test Coverage

The voting system tests cover:

1. **Initial Vote Status**: Checking the current vote state for a product
2. **Upvoting**: Adding an upvote to a product
3. **Downvoting**: Adding a downvote to a product
4. **Vote Toggling**: Removing a vote by clicking the same button again
5. **Vote Changing**: Switching from upvote to downvote or vice versa
6. **Rate Limiting**: Enforcing the 5-vote limit for anonymous users
7. **Vote Persistence**: Ensuring votes are properly stored and retrieved

## Testing Anonymous vs. Authenticated Users

To thoroughly test the system, you should:

1. Test as an anonymous user:
   - Verify rate limiting (max 5 votes per hour)
   - Check that client ID is properly generated and stored

2. Test as an authenticated user:
   - Sign in using the test interface
   - Verify unlimited voting capability
   - Test linking anonymous votes to the authenticated account

## Troubleshooting Common Issues

### Server Connection Issues

If you encounter connection errors:
- Verify the server is running (`npm run dev`)
- Check if it's running on a different port (look for the URL in the console output)
- Update the port in the test scripts if necessary

### Vote Not Being Recorded

If votes aren't being recorded:
- Check browser console for errors
- Verify client ID generation in localStorage
- Check that the API is returning success responses

### Rate Limiting Not Working

If rate limiting doesn't seem to be working:
- Clear localStorage to reset client ID
- Verify the rate limit logic in the API
- Check the vote counts in the data file

## Manual Testing Steps

For a complete manual test of the voting system, follow these steps:

1. Open a browser and go to `http://localhost:3000/test-vote`
2. Check the initial vote status for a product
3. Upvote the product and verify the count increases
4. Upvote again to toggle off and verify the count decreases
5. Downvote the product and verify the count changes
6. Check remaining votes for anonymous users
7. Sign in and verify unlimited voting capability
8. Check that previous anonymous votes are visible to the signed-in user 