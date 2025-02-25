import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { VoteButtons } from '@/components/products/vote-buttons'
import { useVote } from '@/hooks/use-vote'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock the Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockReturnValue({ data: { user: null } }),
      getSession: vi.fn().mockReturnValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    rpc: vi.fn(),
  },
}))

// Import the supabase client after mocking
import { supabase } from '@/lib/supabase/client'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Voting System', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    
    // Clear localStorage between tests
    localStorageMock.clear()
    
    // Reset mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  const mockProduct = {
    id: '123',
    name: 'Test Product',
    upvotes: 10,
    downvotes: 5,
    userVote: null,
  }

  // 1. Test that the component renders correctly
  it('renders the vote buttons correctly', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <VoteButtons product={mockProduct} />
      </QueryClientProvider>
    )

    expect(screen.getByTestId('upvote-button')).toBeInTheDocument()
    expect(screen.getByTestId('downvote-button')).toBeInTheDocument()
    expect(screen.getByTestId('vote-score')).toHaveTextContent('5') // 10 upvotes - 5 downvotes = 5
  })

  // 2. Test anonymous upvoting
  it('handles anonymous upvoting correctly', async () => {
    // Mock the vote function response
    ;(supabase.rpc as any).mockResolvedValueOnce({
      data: {
        vote_type: 1,
        upvotes: 11,
        downvotes: 5,
        has_voted: true,
      },
      error: null,
    })

    ;(supabase.rpc as any).mockResolvedValueOnce({
      data: {
        vote_type: 1,
        has_voted: true,
      },
      error: null,
    })

    render(
      <QueryClientProvider client={queryClient}>
        <VoteButtons product={mockProduct} />
      </QueryClientProvider>
    )

    const upvoteButton = screen.getByTestId('upvote-button')
    
    // Click the upvote button
    fireEvent.click(upvoteButton)

    // Verify that the vote function was called correctly
    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('vote_for_product', {
        p_product_id: mockProduct.id,
        p_vote_type: 1,
        p_client_id: expect.any(String),
      })
    })

    // Check that the score was updated
    await waitFor(() => {
      expect(screen.getByTestId('vote-score')).toHaveTextContent('6')
    })

    // Verify that localStorage has a client ID
    expect(window.localStorage.getItem('tierd_client_id')).not.toBeNull()
  })

  // 3. Test voting removal (clicking same button twice)
  it('handles vote removal correctly', async () => {
    // First vote
    ;(supabase.rpc as any).mockResolvedValueOnce({
      data: {
        vote_type: 1,
        upvotes: 11,
        downvotes: 5,
        has_voted: true,
      },
      error: null,
    })

    // Check vote
    ;(supabase.rpc as any).mockResolvedValueOnce({
      data: {
        vote_type: 1,
        has_voted: true,
      },
      error: null,
    })

    // Remove vote
    ;(supabase.rpc as any).mockResolvedValueOnce({
      data: {
        vote_type: null,
        upvotes: 10,
        downvotes: 5,
        has_voted: false,
      },
      error: null,
    })

    // Mock product with existing vote
    const votedProduct = {
      ...mockProduct,
      upvotes: 11,
      userVote: 1,
    }

    render(
      <QueryClientProvider client={queryClient}>
        <VoteButtons product={votedProduct} />
      </QueryClientProvider>
    )

    const upvoteButton = screen.getByTestId('upvote-button')
    
    // Click the upvote button again to remove vote
    fireEvent.click(upvoteButton)

    // Verify that the vote function was called correctly
    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('vote_for_product', {
        p_product_id: mockProduct.id,
        p_vote_type: 1,
        p_client_id: expect.any(String),
      })
    })

    // Check that the score was updated
    await waitFor(() => {
      expect(screen.getByTestId('vote-score')).toHaveTextContent('5')
    })
  })

  // 4. Test changing vote type (upvote to downvote)
  it('handles changing vote type correctly', async () => {
    // First upvote
    ;(supabase.rpc as any).mockResolvedValueOnce({
      data: {
        vote_type: 1,
        upvotes: 11,
        downvotes: 5,
        has_voted: true,
      },
      error: null,
    })

    // Check vote
    ;(supabase.rpc as any).mockResolvedValueOnce({
      data: {
        vote_type: 1,
        has_voted: true,
      },
      error: null,
    })

    // Change to downvote
    ;(supabase.rpc as any).mockResolvedValueOnce({
      data: {
        vote_type: -1,
        upvotes: 10,
        downvotes: 6,
        has_voted: true,
      },
      error: null,
    })

    render(
      <QueryClientProvider client={queryClient}>
        <VoteButtons product={mockProduct} />
      </QueryClientProvider>
    )

    // First upvote
    const upvoteButton = screen.getByTestId('upvote-button')
    fireEvent.click(upvoteButton)

    await waitFor(() => {
      expect(screen.getByTestId('vote-score')).toHaveTextContent('6')
    })

    // Then downvote
    const downvoteButton = screen.getByTestId('downvote-button')
    fireEvent.click(downvoteButton)

    // Verify the second vote call
    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenLastCalledWith('vote_for_product', {
        p_product_id: mockProduct.id,
        p_vote_type: -1,
        p_client_id: expect.any(String),
      })
    })

    // Check that the score was updated
    await waitFor(() => {
      expect(screen.getByTestId('vote-score')).toHaveTextContent('4')
    })
  })

  // 5. Test error handling
  it('handles errors correctly', async () => {
    // Mock error response
    ;(supabase.rpc as any).mockResolvedValueOnce({
      data: null,
      error: new Error('Vote failed'),
    })

    render(
      <QueryClientProvider client={queryClient}>
        <VoteButtons product={mockProduct} />
      </QueryClientProvider>
    )

    const upvoteButton = screen.getByTestId('upvote-button')
    
    // Click the upvote button
    fireEvent.click(upvoteButton)

    // Verify error handled and UI reverted
    await waitFor(() => {
      expect(screen.getByTestId('vote-score')).toHaveTextContent('5')
    })
  })

  // 6. Test authenticated user voting
  it('handles authenticated user voting', async () => {
    // Mock authenticated user
    ;(supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: 'user-123' } },
    })
    
    ;(supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
    })

    // Mock vote response
    ;(supabase.rpc as any).mockResolvedValueOnce({
      data: {
        vote_type: 1,
        upvotes: 11,
        downvotes: 5,
        has_voted: true,
      },
      error: null,
    })

    ;(supabase.rpc as any).mockResolvedValueOnce({
      data: {
        vote_type: 1,
        has_voted: true,
      },
      error: null,
    })

    render(
      <QueryClientProvider client={queryClient}>
        <VoteButtons product={mockProduct} />
      </QueryClientProvider>
    )

    const upvoteButton = screen.getByTestId('upvote-button')
    
    // Click the upvote button
    fireEvent.click(upvoteButton)

    // Verify the vote function was called with user ID
    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('vote_for_product', {
        p_product_id: mockProduct.id,
        p_vote_type: 1,
        p_client_id: expect.any(String),
      })
    })

    // Check that the score was updated
    await waitFor(() => {
      expect(screen.getByTestId('vote-score')).toHaveTextContent('6')
    })
  })

  // 7. Test vote state persistence on reload
  it('persists vote state when checking existing votes', async () => {
    // Mock existing vote
    ;(supabase.rpc as any).mockResolvedValueOnce({
      data: {
        vote_type: 1,
        has_voted: true,
      },
      error: null,
    })

    render(
      <QueryClientProvider client={queryClient}>
        <VoteButtons product={mockProduct} />
      </QueryClientProvider>
    )

    // Wait for the checkUserVote call to complete
    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('has_user_voted', {
        p_product_id: mockProduct.id,
        p_client_id: expect.any(String),
      })
    })

    // Verify that the upvote button has the active class
    const upvoteButton = screen.getByTestId('upvote-button')
    await waitFor(() => {
      expect(upvoteButton).toHaveClass('bg-primary/10')
    })
  })
}) 