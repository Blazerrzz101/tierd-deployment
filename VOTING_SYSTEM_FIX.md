# Tierd Voting System Fix

This document outlines the issues with the voting system and provides solutions to resolve them.

## Issue Description

The voting system is experiencing errors due to parameter order mismatches between the API calls and the Supabase SQL functions. Specifically:

1. API calls to `has_user_voted` and `vote_for_product` functions are sending parameters in one order
2. The SQL functions in Supabase are expecting them in a different order
3. There are multiple function overloads causing ambiguity in the database

The errors you might be seeing:

```
Error checking vote status: Could not find the function public.has_user_voted(p_client_id, p_product_id, p_user_id) in the schema cache
```

```
Could not choose the best candidate function between: public.vote_for_product(p_client_id => text, p_product_id => uuid, p_user_id => uuid, p_vote_type => integer), public.vote_for_product(p_product_id => uuid, p_vote_type => integer, p_client_id => text, p_user_id => uuid)
```

## Solution

We've prepared multiple solutions to resolve these issues:

### 1. Updated API Implementation

The API implementation in `app/api/vote/route.ts` has been updated to:

- Try multiple parameter orders when calling the functions
- Gracefully handle errors and attempt fallback approaches
- Add better error logging for debugging

### 2. SQL Function Fixes

We've created SQL scripts to fix the database functions:

- `fix-vote-functions-directly-update.sql`: Updated SQL script that drops conflicting functions and creates standardized versions
- `run-vote-fix.js`: Node.js script to apply the SQL fixes to your Supabase database

## How to Apply the Fix

### Option 1: Using the Node.js Script (Recommended)

1. Make sure your `.env` file contains the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. Install dependencies (if not already done):
   ```bash
   npm install dotenv @supabase/supabase-js
   ```

3. Run the fix script:
   ```bash
   node run-vote-fix.js
   ```

4. Restart your application server

### Option 2: Using the Supabase Dashboard

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Open the `fix-vote-functions-directly-update.sql` file
4. Copy the entire contents and paste into the SQL Editor
5. Execute the SQL
6. Restart your application server

### Option 3: Manual API Updates Only

If you can't modify the database functions, you can still improve the situation by:

1. Using the updated `app/api/vote/route.ts` file with better parameter handling
2. This won't completely fix the issue but will make the API more resilient to parameter order changes

## Verification

After applying the fix, you can verify it worked by:

1. Starting your application server
2. Accessing a product page
3. Attempting to upvote or downvote a product
4. Checking the console logs for any voting-related errors

## Further Assistance

If you encounter any issues with the voting system after applying these fixes, please:

1. Check the server logs for specific error messages
2. Verify your Supabase functions by using the SQL Editor's "Functions" section
3. Ensure your API is correctly calling the functions with the updated code

## Technical Details

### Function Parameter Order

The correct parameter order for the functions should be:

- `vote_for_product`: (p_product_id, p_vote_type, p_user_id, p_client_id)
- `has_user_voted`: (p_product_id, p_user_id, p_client_id)

The updated version adds a two-parameter convenience function:
- `has_user_voted`: (p_product_id, p_client_id)

### Improved Error Handling

Both the API and SQL functions now have better error handling:

- The API tries multiple parameter orders before failing
- The SQL functions validate inputs more thoroughly
- More detailed error messages are provided

### SQL Function Overloading

To prevent function overloading issues, the fix script:

1. Drops all existing versions of the functions
2. Creates new versions with standardized parameter orders
3. Adds convenience functions for common use cases 