/** @jest-environment jsdom */
import { renderHook, act } from '@testing-library/react'
import { useVote } from '@/hooks/use-vote'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/auth/auth-store'
import type { Product } from '@/types/product'
import type { PostgrestResponse, Session, AuthError, RealtimeChannel } from '@supabase/supabase-js'
import type { VoteResponse } from '@/types/vote'

// Mock uuid
jest.mock('uuid', () => ({
  v4: () => 'test-uuid'
}))

// Create typed mock for Supabase client
const mockSupabase = {
  rpc: jest.fn(),
  channel: jest.fn(),
  removeChannel: jest.fn(),
  auth: {
    getSession: jest.fn()
  }
} as unknown as jest.Mocked<typeof supabase>

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockImplementation(() => Promise.resolve({
        data: { session: null },
        error: null
      })),
      onAuthStateChange: jest.fn(),
      signOut: jest.fn()
    },
    rpc: jest.fn().mockImplementation(() => Promise.resolve({
      data: [{
        success: true,
        vote_id: 'test-vote-id',
        vote_type: 1,
        created_at: new Date().toISOString()
      }],
      error: null,
      count: null,
      status: 200,
      statusText: 'OK'
    })),
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      topic: 'test-topic',
      params: {},
      socket: {} as any,
      bindings: {},
      state: 'SUBSCRIBED',
      unsubscribe: jest.fn(),
      send: jest.fn()
    } as unknown as RealtimeChannel)
  }
}))

// Mock auth store
jest.mock('@/lib/auth/auth-store')
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>

// Mock storage implementation
const mockStorage: { [key: string]: string } = {}

// Properly typed storage mock functions
const mockGetItem = jest.fn((key: string) => mockStorage[key] ?? null)
const mockSetItem = jest.fn((key: string, value: string) => { mockStorage[key] = value })
const mockRemoveItem = jest.fn((key: string) => { delete mockStorage[key] })
const mockClear = jest.fn(() => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]) })

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: mockGetItem,
    setItem: mockSetItem,
    removeItem: mockRemoveItem,
    clear: mockClear,
    length: 0,
    key: jest.fn()
  },
  writable: true
})

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
    votes: [],
    userVote: null,
    total_votes: 15,
    score: 5,
    rank: 1,
    review_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  // Mock storage data
  let storageData: Record<string, string> = {}
  let getItemSpy: jest.SpyInstance
  let setItemSpy: jest.SpyInstance
  let removeItemSpy: jest.SpyInstance
  let clearSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    storageData = {}

    // Mock localStorage methods using jest.spyOn with proper types
    getItemSpy = jest.spyOn(Storage.prototype, 'getItem')
      .mockImplementation((key: string) => storageData[key] ?? null)
    
    setItemSpy = jest.spyOn(Storage.prototype, 'setItem')
      .mockImplementation((key: string, value: string) => {
        storageData[key] = value
      })
    
    removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem')
      .mockImplementation((key: string) => {
        delete storageData[key]
      })
    
    clearSpy = jest.spyOn(Storage.prototype, 'clear')
      .mockImplementation(() => {
        storageData = {}
      })

    // Mock authenticated user
    mockUseAuthStore.mockImplementation(() => ({
      isAuthenticated: true,
      user: { id: 'test-user' },
      checkAuth: jest.fn()
    }))

    // Mock Supabase channel
    mockSupabase.channel.mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      topic: 'test-topic',
      params: {},
      socket: {} as any,
      bindings: {},
      state: 'SUBSCRIBED',
      unsubscribe: jest.fn(),
      send: jest.fn()
    } as unknown as RealtimeChannel)

    // Mock Supabase RPC with proper response type
    mockSupabase.rpc.mockResolvedValue({
      data: [{
        success: true,
        vote_id: 'test-vote-id',
        vote_type: 1,
        created_at: new Date().toISOString()
      }],
      error: null,
      count: null,
      status: 200,
      statusText: 'OK'
    } as PostgrestResponse<VoteResponse>)

    // Mock Supabase auth
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    } as { data: { session: Session | null }, error: AuthError | null })
  })

  afterEach(() => {
    // Restore all mocks
    getItemSpy.mockRestore()
    setItemSpy.mockRestore()
    removeItemSpy.mockRestore()
    clearSpy.mockRestore()
  })

  test('initializes with correct state', () => {
    const { result } = renderHook(() => useVote(mockProduct))

    expect(result.current.product).toEqual(mockProduct)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isVoting).toBe(false)
    expect(storageData['anonymous_id']).toBe('test-uuid')
  })

  test('handles successful vote', async () => {
    storageData['anonymous_id'] = 'test-anonymous-id'
    mockSupabase.rpc.mockResolvedValueOnce({
      data: [{
        success: true,
        vote_id: 'test-vote-id',
        vote_type: 1,
        created_at: new Date().toISOString()
      }],
      error: null,
      count: null,
      status: 200,
      statusText: 'OK'
    } as PostgrestResponse<VoteResponse>)

    const { result } = renderHook(() => useVote(mockProduct))

    await act(async () => {
      await result.current.vote('upvote')
    })

    expect(mockSupabase.rpc).toHaveBeenCalledWith(
      'handle_authenticated_vote',
      expect.objectContaining({
        p_product_id: mockProduct.id,
        p_vote_type: 'upvote',
        p_user_id: 'test-user'
      })
    )
  })

  test('handles vote error', async () => {
    storageData['anonymous_id'] = 'test-anonymous-id'
    const error = new Error('Vote failed')
    mockSupabase.rpc.mockRejectedValueOnce(error)

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
    storageData['anonymous_id'] = 'test-anonymous-id'
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

    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })

  test('updates local state after vote', async () => {
    storageData['anonymous_id'] = 'test-anonymous-id'
    mockSupabase.rpc.mockResolvedValueOnce({
      data: [{
        success: true,
        vote_id: 'test-vote-id',
        vote_type: 1,
        created_at: new Date().toISOString()
      }],
      error: null,
      count: null,
      status: 200,
      statusText: 'OK'
    } as PostgrestResponse<VoteResponse>)

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

      expect(storageData.removeItem).not.toHaveBeenCalled()
    })
  })
}) 