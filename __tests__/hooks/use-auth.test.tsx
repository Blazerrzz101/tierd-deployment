import { renderHook, act } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { AuthError, User, Session, WeakPassword } from '@supabase/supabase-js'
import { vi } from 'vitest'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      onAuthStateChange: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      insert: vi.fn(() => ({
        single: vi.fn()
      })),
      update: vi.fn(() => ({
        eq: vi.fn()
      }))
    }))
  }
}))

// Mock window.location
const mockLocation = {
  origin: 'http://localhost:3000'
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
})

// Mock user data
const mockUser: User = {
  id: '123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  role: 'authenticated',
  updated_at: new Date().toISOString()
}

// Mock session data
const mockSession: Session = {
  access_token: 'mock-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'mock-refresh-token',
  user: mockUser,
  expires_at: Math.floor(Date.now() / 1000) + 3600
}

// Mock auth error
const mockAuthError: AuthError = {
  name: 'AuthError',
  message: 'Invalid credentials',
  status: 400,
  code: 'invalid_credentials',
  __isAuthError: true
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signInWithEmail', () => {
    it('signs in successfully with email and password', async () => {
      const mockProfile = {
        id: '123',
        display_name: 'Test User'
      }

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      vi.mocked(supabase.from).mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: mockProfile,
          error: null
        }),
        url: new URL('http://example.com'),
        headers: {},
        insert: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
        filter: vi.fn()
      }))

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signInWithEmail('test@example.com', 'password')
      })

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      })
    })

    it('handles sign in errors', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: new AuthError('Invalid credentials')
      })

      const { result } = renderHook(() => useAuth())

      await expect(
        act(async () => {
          await result.current.signInWithEmail('test@example.com', 'wrong')
        })
      ).rejects.toThrow('Invalid credentials')
    })
  })

  describe('signInWithProvider', () => {
    it('initiates OAuth sign in', async () => {
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValueOnce({
        data: { provider: 'github', url: 'http://auth.url' },
        error: null
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signInWithProvider('github')
      })

      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'github',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback'
        }
      })
    })
  })

  describe('signUp', () => {
    it('creates a new account successfully', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      vi.mocked(supabase.from).mockImplementationOnce(() => ({
        insert: vi.fn().mockResolvedValueOnce({
          error: null
        }),
        url: new URL('http://example.com'),
        headers: {},
        select: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
        filter: vi.fn()
      }))

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signUp('new@example.com', 'password', 'newuser')
      })

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password',
        options: {
          data: {
            username: 'newuser'
          }
        }
      })
    })
  })

  describe('signOut', () => {
    it('signs out successfully', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
        error: null
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signOut()
      })

      expect(supabase.auth.signOut).toHaveBeenCalled()
      expect(result.current.user).toBeNull()
    })
  })

  describe('resetPassword', () => {
    it('sends reset password email', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({
        data: {},
        error: null
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.resetPassword('test@example.com')
      })

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'http://localhost:3000/auth/reset-password'
        }
      )
    })
  })

  describe('updateProfile', () => {
    it('updates user profile successfully', async () => {
      const mockProfile = {
        id: '123',
        display_name: 'Updated Name'
      }

      vi.mocked(supabase.from).mockImplementationOnce(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValueOnce({
          error: null
        }),
        url: new URL('http://example.com'),
        headers: {},
        select: vi.fn(),
        insert: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
        filter: vi.fn()
      }))

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.updateProfile(mockProfile)
      })

      expect(supabase.from).toHaveBeenCalledWith('user_profiles')
    })
  })
}) 