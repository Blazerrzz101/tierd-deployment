# Tier'd - Community-Driven Gaming Gear Rankings

A Next.js application with Supabase backend for community-driven gaming gear rankings, reviews, and discussions.

## Features

- User authentication
- Real-time voting system
- Product reviews with ratings
- Real-time updates
- Rate limiting for votes and reviews

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Environment Setup

1. Create a `.env` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

## Authentication System

The authentication system uses Supabase Auth with email/password sign-in.

### Usage

```typescript
import { useAuth } from "@/hooks/use-auth"

function MyComponent() {
  const { user, signIn, signUp, signOut } = useAuth()

  // Sign in
  await signIn(email, password)

  // Sign up
  await signUp(email, password, username)

  // Sign out
  await signOut()
}
```

### Protected Routes

Use the AuthGuard component to protect routes:

```typescript
import { AuthGuard } from "@/components/auth/auth-guard"

function ProtectedPage() {
  return (
    <AuthGuard>
      <YourComponent />
    </AuthGuard>
  )
}
```

## Voting System

The voting system allows authenticated users to upvote or downvote products with rate limiting.

### Usage

```typescript
import { useVote } from "@/hooks/use-vote"

function ProductVoting({ product }) {
  const { product: currentProduct, vote } = useVote(product)

  // Handle vote
  const handleVote = (type: 'up' | 'down') => {
    vote(type)
  }
}
```

### Rate Limiting

Vote rate limiting is handled by `use-vote-limiter`:
- Cooldown period between votes
- Maximum votes per time window
- Persistent tracking using localStorage

## Review System

The review system allows users to submit, edit, and delete reviews with ratings.

### Usage

```typescript
import { useReview } from "@/hooks/use-review"

function ProductReviews({ productId }) {
  const { reviews, submitReview, deleteReview } = useReview(productId)

  // Submit review
  await submitReview({
    title: "Great Product",
    content: "Detailed review...",
    rating: 5
  })

  // Delete review
  await deleteReview(reviewId)
}
```

### Review Components

1. Review Form:
```typescript
import { ReviewForm } from "@/components/products/review-form"

<ReviewForm 
  onSubmit={handleSubmit}
  initialData={existingReview} // Optional, for editing
/>
```

2. Review List:
```typescript
import { ReviewList } from "@/components/products/review-list"

<ReviewList
  reviews={reviews}
  onDelete={handleDelete}
  onEdit={handleEdit}
  onHelpful={handleHelpfulVote}
/>
```

### Rate Limiting

Review submissions are rate-limited:
- Maximum 3 reviews per day
- 24-hour cooldown between reviews per product
- Tracked using `use-review-limiter`

## Real-Time Updates

Real-time updates are handled through Supabase subscriptions:

```typescript
// hooks/use-realtime-updates.ts
useEffect(() => {
  const channel = supabase
    .channel('product_votes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'product_votes' },
      (payload) => {
        window.dispatchEvent(new CustomEvent('vote-update', {
          detail: payload.new
        }))
      }
    )
    .subscribe()

  return () => {
    channel.unsubscribe()
  }
}, [])
```

## Testing

### Local Testing

1. Test Authentication:
```bash
# Test sign up
- Fill out sign-up form with email and password
- Verify email verification flow
- Test login with credentials

# Test protected routes
- Attempt to access protected routes while logged out
- Verify redirect to login
```

2. Test Voting:
```bash
# Test vote submission
- Vote on a product while logged in
- Verify rate limiting
- Test vote toggling

# Test real-time updates
- Open multiple browsers/tabs
- Verify vote counts update in real-time
```

3. Test Reviews:
```bash
# Test review submission
- Submit a review with rating
- Verify rate limiting
- Test editing and deletion
- Verify helpful vote system
```

## Deployment

1. Create a production Supabase project

2. Configure environment variables in your hosting platform (e.g., Vercel):
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_key
```

3. Deploy using your preferred hosting service:
```bash
# Example for Vercel
vercel
```

### Security Considerations

- Never expose the `service_role` key
- Use Row Level Security (RLS) policies
- Enable email verification for new accounts
- Implement proper CORS policies

## Troubleshooting

Common issues and solutions:

1. Real-time updates not working:
- Check Supabase connection
- Verify channel subscription
- Check browser console for errors

2. Authentication issues:
- Clear browser storage
- Check environment variables
- Verify email confirmation settings

3. Rate limiting issues:
- Clear localStorage
- Check browser console
- Verify timing calculations