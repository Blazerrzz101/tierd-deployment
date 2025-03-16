import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export const createMockSupabaseClient = () => {
  const mockClient = {
    rpc: jest.fn(),
    from: jest.fn(),
    channel: jest.fn(),
    removeChannel: jest.fn(),
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signOut: jest.fn(),
      signInWithOAuth: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn()
    }
  }

  // Type the mock client
  return mockClient as unknown as jest.Mocked<SupabaseClient<Database>>
}

// Create a singleton instance
export const mockSupabase = createMockSupabaseClient()

// Helper to reset all mocks
export const resetSupabaseMocks = () => {
  jest.clearAllMocks()
  
  // Reset common mock implementations
  mockSupabase.channel.mockReturnValue({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn()
  } as any)

  mockSupabase.auth.getSession.mockResolvedValue({
    data: { session: null },
    error: null
  })

  mockSupabase.rpc.mockResolvedValue({
    data: null,
    error: null,
    count: null,
    status: 200,
    statusText: 'OK'
  })
}

// Helper to mock authenticated session
export const mockAuthenticatedSession = (userId: string = 'test-user') => {
  mockSupabase.auth.getSession.mockResolvedValue({
    data: {
      session: {
        user: { id: userId },
        access_token: 'test-token',
        refresh_token: 'test-refresh-token',
        expires_at: Date.now() + 3600
      }
    },
    error: null
  })
}

// Helper to mock database responses
export const mockDatabaseResponse = <T>(data: T) => ({
  data,
  error: null,
  count: null,
  status: 200,
  statusText: 'OK'
}) 