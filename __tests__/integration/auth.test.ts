/** @jest-environment jsdom */
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '@/lib/auth/auth-store'
import { supabase } from '@/lib/supabase/client'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn((callback) => {
        callback('SIGNED_IN', { session: mockSession })
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })
    },
    rpc: jest.fn().mockResolvedValue({
      data: { success: true },
      error: null
    })
  }
}))

describe('Authentication Integration', () => {
  const mockUser = {
    id: 'test-user',
    email: 'test@example.com'
  }

  const mockSession = {
    user: mockUser,
    access_token: 'test-token'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
      error: null
    })
  })

  test('useAuthStore initializes with correct state', async () => {
    const { result } = renderHook(() => useAuthStore())
    
    await act(async () => {
      await result.current.checkAuth()
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.session).toEqual(mockSession)
  })

  test('signOut clears auth state', async () => {
    const { result } = renderHook(() => useAuthStore())
    
    await act(async () => {
      await result.current.signOut()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
    expect(supabase.auth.signOut).toHaveBeenCalled()
  })

  test('auth state updates on session change', async () => {
    const { result } = renderHook(() => useAuthStore())
    
    await act(async () => {
      await result.current.checkAuth()
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual(mockUser)
  })

  test('handles auth errors gracefully', async () => {
    ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: new Error('Auth error')
    })

    const { result } = renderHook(() => useAuthStore())
    
    await act(async () => {
      await result.current.checkAuth()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
  })

  test('user activity is tracked', async () => {
    const { result } = renderHook(() => useAuthStore())
    
    await act(async () => {
      await result.current.checkAuth()
    })

    expect(supabase.rpc).toHaveBeenCalledWith(
      'log_user_activity',
      expect.any(Object)
    )
  })
}) 