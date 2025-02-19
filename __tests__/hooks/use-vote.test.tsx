/** @jest-environment jsdom */
import { renderHook, act } from '@testing-library/react'
import { useVote } from '@/hooks/use-vote'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/auth/auth-store'
import type { Product } from '@/types/product'
import type { Vote } from '@/types/vote'

// Mock uuid
jest.mock('uuid', () => ({
  v4: () => 'test-uuid'
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    rpc: jest.fn(() => Promise.resolve({ data: { success: true }, error: null })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({ subscribe: jest.fn() })),
      subscribe: jest.fn()
    })),
    removeChannel: jest.fn()
  }
}))

// Mock auth store
jest.mock('@/lib/auth/auth-store')
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>

describe('useVote Hook', () => {
  const mockProduct: Product = {
    id: 'test-product',
    name: 'Test Product',
    description: 'Test Description',
    category: 'Gaming Mice',
    price: 0,
    image_url: 'test.jpg',
    url_slug: 'test-product',
    specifications: {},
    upvotes: 10,
    downvotes: 5,
    rating: 0,
    votes: [] as Vote[],
    userVote: null,
    total_votes: 15,
    score: 5,
    rank: 1,
    review_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const mockStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage
    })

    // Mock authenticated user
    mockUseAuthStore.mockImplementation(() => ({
      isAuthenticated: true,
      user: { id: 'test-user' },
      checkAuth: jest.fn()
    }))

    // Reset Supabase mock
    const mockRpc = jest.fn().mockResolvedValue({ data: { success: true }, error: null })
    ;(supabase.rpc as jest.Mock).mockImplementation(mockRpc)
  })

  test('initializes with correct state', () => {
    const { result } = renderHook(() => useVote(mockProduct))

    expect(result.current.product).toEqual(mockProduct)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isVoting).toBe(false)
    expect(mockStorage.setItem).toHaveBeenCalledWith('anonymous_id', 'test-uuid')
  })

  test('handles successful vote', async () => {
    mockStorage.getItem.mockReturnValue('test-anonymous-id')
    ;(supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: { success: true },
      error: null
    })

    const { result } = renderHook(() => useVote(mockProduct))

    await act(async () => {
      await result.current.vote('upvote')
    })

    expect(supabase.rpc).toHaveBeenCalledWith(
      'handle_authenticated_vote',
      expect.objectContaining({
        p_product_id: mockProduct.id,
        p_vote_type: 'upvote',
        p_user_id: 'test-user'
      })
    )
  })

  test('handles vote error', async () => {
    mockStorage.getItem.mockReturnValue('test-anonymous-id')
    const error = new Error('Vote failed')
    ;(supabase.rpc as jest.Mock).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useVote(mockProduct))

    await act(async () => {
      try {
        await result.current.vote('upvote')
      } catch (err) {
        expect(err).toBe(error)
      }
    })

    expect(result.current.isVoting).toBe(false)
  })

  test('prevents voting when not authenticated', async () => {
    mockStorage.getItem.mockReturnValue('test-anonymous-id')
    // Mock unauthenticated user
    mockUseAuthStore.mockImplementation(() => ({
      isAuthenticated: false,
      user: null,
      checkAuth: jest.fn()
    }))

    const { result } = renderHook(() => useVote(mockProduct))

    await act(async () => {
      try {
        await result.current.vote('upvote')
      } catch (err: unknown) {
        if (err instanceof Error) {
          expect(err.message).toBe('Please sign in to vote')
        }
      }
    })

    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  test('updates local state after vote', async () => {
    mockStorage.getItem.mockReturnValue('test-anonymous-id')
    ;(supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: { success: true, vote_type: 1 },
      error: null
    })

    const { result } = renderHook(() => useVote(mockProduct))

    await act(async () => {
      await result.current.vote('upvote')
    })

    expect(result.current.product.upvotes).toBe(11)
    expect(result.current.product.userVote).toBe(1)
  })

  describe('anonymous voting', () => {
    beforeEach(() => {
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null
      })
    })

    it('allows anonymous voting within limit', async () => {
      const { result } = renderHook(() => useVote())

      await act(async () => {
        await result.current.vote('product-1', 'up')
      })

      expect(global.Storage.prototype.setItem).toHaveBeenCalled()
      expect(supabase.from).toHaveBeenCalledWith('votes')
    })

    it('prevents voting when limit is reached', async () => {
      // Mock 5 existing votes
      global.Storage.prototype.getItem.mockReturnValue(JSON.stringify(
        Array(5).fill({
          productId: 'product-x',
          voteType: 'up',
          timestamp: Date.now()
        })
      ))

      const { result } = renderHook(() => useVote())

      await act(async () => {
        await result.current.vote('product-1', 'up')
      })

      expect(supabase.from).not.toHaveBeenCalled()
    })

    it('cleans up old votes', async () => {
      const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      global.Storage.prototype.getItem.mockReturnValue(JSON.stringify([
        {
          productId: 'product-1',
          voteType: 'up',
          timestamp: oldTimestamp
        }
      ]))

      const { result } = renderHook(() => useVote())

      await act(async () => {
        await result.current.vote('product-2', 'up')
      })

      // Should have cleaned up old vote and allowed new one
      expect(global.Storage.prototype.setItem).toHaveBeenCalled()
      expect(supabase.from).toHaveBeenCalledWith('votes')
    })
  })

  describe('authenticated voting', () => {
    const mockSession = {
      user: { id: 'user-1' }
    }

    beforeEach(() => {
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })
    })

    it('creates a new vote', async () => {
      ;(supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: null })
          }))
        })),
        insert: jest.fn().mockResolvedValue({ error: null }),
        update: jest.fn(),
        delete: jest.fn()
      }))

      const { result } = renderHook(() => useVote())

      await act(async () => {
        await result.current.vote('product-1', 'up')
      })

      expect(supabase.from).toHaveBeenCalledWith('votes')
      expect(supabase.rpc).toHaveBeenCalledWith('refresh_product_rankings')
    })

    it('updates an existing vote', async () => {
      const existingVote = {
        id: 'vote-1',
        vote_type: 'up'
      }

      ;(supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: existingVote })
          }))
        })),
        insert: jest.fn(),
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null })
        })),
        delete: jest.fn()
      }))

      const { result } = renderHook(() => useVote())

      await act(async () => {
        await result.current.vote('product-1', 'down')
      })

      expect(supabase.from).toHaveBeenCalledWith('votes')
      expect(supabase.rpc).toHaveBeenCalledWith('refresh_product_rankings')
    })

    it('removes an existing vote when clicking same type', async () => {
      const existingVote = {
        id: 'vote-1',
        vote_type: 'up'
      }

      ;(supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: existingVote })
          }))
        })),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null })
        }))
      }))

      const { result } = renderHook(() => useVote())

      await act(async () => {
        await result.current.vote('product-1', 'up')
      })

      expect(supabase.from).toHaveBeenCalledWith('votes')
      expect(supabase.rpc).toHaveBeenCalledWith('refresh_product_rankings')
    })
  })

  describe('claimAnonymousVotes', () => {
    it('claims anonymous votes for authenticated user', async () => {
      const anonymousVotes = [
        { product_id: 'product-1', vote_type: 'up' },
        { product_id: 'product-2', vote_type: 'down' }
      ]

      ;(supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: anonymousVotes })
        })),
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null })
        }))
      }))

      const { result } = renderHook(() => useVote())

      await act(async () => {
        await result.current.claimAnonymousVotes('user-1')
      })

      expect(global.Storage.prototype.removeItem).toHaveBeenCalled()
      expect(supabase.from).toHaveBeenCalledWith('votes')
    })

    it('handles errors when claiming votes', async () => {
      ;(supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: new Error('Database error') })
        })),
        update: jest.fn()
      }))

      const { result } = renderHook(() => useVote())

      await act(async () => {
        await result.current.claimAnonymousVotes('user-1')
      })

      expect(mockStorage.removeItem).not.toHaveBeenCalled()
    })
  })
}) 