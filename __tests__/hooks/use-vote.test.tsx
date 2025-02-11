import { renderHook, act } from '@testing-library/react'
import { useVote } from '@/hooks/use-vote'
import { supabase } from '@/lib/supabase/client'
import { vi } from 'vitest'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      insert: vi.fn(),
      update: vi.fn(() => ({
        eq: vi.fn(),
        match: vi.fn()
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
        match: vi.fn()
      }))
    })),
    rpc: vi.fn()
  }
}))

describe('useVote', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  describe('anonymous voting', () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null
      })
    })

    it('allows anonymous voting within limit', async () => {
      const { result } = renderHook(() => useVote())

      await act(async () => {
        await result.current.vote('product-1', 'up')
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      expect(supabase.from).toHaveBeenCalledWith('votes')
    })

    it('prevents voting when limit is reached', async () => {
      // Mock 5 existing votes
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(
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
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
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
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      expect(supabase.from).toHaveBeenCalledWith('votes')
    })
  })

  describe('authenticated voting', () => {
    const mockSession = {
      user: { id: 'user-1' }
    }

    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })
    })

    it('creates a new vote', async () => {
      vi.mocked(supabase.from).mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null })
          }))
        })),
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn(),
        delete: vi.fn()
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

      vi.mocked(supabase.from).mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: existingVote })
          }))
        })),
        insert: vi.fn(),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        })),
        delete: vi.fn()
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

      vi.mocked(supabase.from).mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: existingVote })
          }))
        })),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
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

      vi.mocked(supabase.from).mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: anonymousVotes })
        })),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        }))
      }))

      const { result } = renderHook(() => useVote())

      await act(async () => {
        await result.current.claimAnonymousVotes('user-1')
      })

      expect(mockLocalStorage.removeItem).toHaveBeenCalled()
      expect(supabase.from).toHaveBeenCalledWith('votes')
    })

    it('handles errors when claiming votes', async () => {
      vi.mocked(supabase.from).mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: new Error('Database error') })
        })),
        update: vi.fn()
      }))

      const { result } = renderHook(() => useVote())

      await act(async () => {
        await result.current.claimAnonymousVotes('user-1')
      })

      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled()
    })
  })
}) 