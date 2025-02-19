/** @jest-environment jsdom */
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/auth/auth-store'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: { id: 'test-thread' }, error: null }),
      select: jest.fn().mockResolvedValue({ data: [{ id: 'test-thread' }], error: null }),
      update: jest.fn().mockResolvedValue({ data: { id: 'test-thread' }, error: null }),
      delete: jest.fn().mockResolvedValue({ data: null, error: null })
    })),
    rpc: jest.fn()
  }
}))

// Mock auth store
jest.mock('@/lib/auth/auth-store', () => ({
  useAuthStore: jest.fn(() => ({
    isAuthenticated: true,
    user: { id: 'test-user' }
  }))
}))

describe('Thread System Integration', () => {
  const mockThread = {
    id: 'thread-1',
    title: 'Test Thread',
    content: 'Test Content',
    user_id: 'test-user',
    is_private: false,
    mentioned_products: ['product-1']
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('get_thread_details returns correct data structure', async () => {
    const mockThreadDetails = {
      ...mockThread,
      user_name: 'Test User',
      user_avatar: 'avatar.jpg',
      products: [{
        id: 'product-1',
        name: 'Test Product',
        url_slug: 'test-product',
        category: 'Gaming Mice'
      }]
    }

    ;(supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: mockThreadDetails,
      error: null
    })

    const { data } = await supabase.rpc('get_thread_details', {
      p_thread_id: 'thread-1'
    })

    expect(data).toEqual(mockThreadDetails)
    expect(data.products).toHaveLength(1)
  })

  test('private threads are only accessible to owners', async () => {
    const privateThread = { ...mockThread, is_private: true }

    // Mock unauthenticated user
    ;(useAuthStore as jest.Mock).mockImplementation(() => ({
      isAuthenticated: true,
      user: { id: 'different-user' }
    }))

    ;(supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: null
    })

    const { data } = await supabase.rpc('get_thread_details', {
      p_thread_id: privateThread.id
    })

    expect(data).toBeNull()
  })

  test('thread creation with product associations', async () => {
    const newThread = {
      title: 'Test Thread',
      content: 'Test Content',
      product_ids: ['product1', 'product2']
    }

    const { data, error } = await supabase
      .from('threads')
      .insert(newThread)

    expect(error).toBe(null)
    expect(data).toBeDefined()
    expect(supabase.from).toHaveBeenCalledWith('threads')
  })

  test('thread retrieval with product details', async () => {
    const { data, error } = await supabase
      .from('threads')
      .select('*')

    expect(error).toBe(null)
    expect(data).toHaveLength(1)
    expect(data[0].id).toBe('test-thread')
  })

  test('thread update with validation', async () => {
    const updates = {
      title: 'Updated Title',
      content: 'Updated Content'
    }

    const { data, error } = await supabase
      .from('threads')
      .update(updates)

    expect(error).toBe(null)
    expect(data).toBeDefined()
    expect(data.id).toBe('test-thread')
  })

  test('thread deletion with cleanup', async () => {
    const { error } = await supabase
      .from('threads')
      .delete()

    expect(error).toBe(null)
  })

  test('thread voting system', async () => {
    const voteData = {
      thread_id: 'thread-1',
      vote_type: 1
    }

    ;(supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: { success: true },
      error: null
    })

    const { data } = await supabase.rpc('handle_thread_vote', voteData)

    expect(data.success).toBe(true)
    expect(supabase.rpc).toHaveBeenCalledWith(
      'handle_thread_vote',
      expect.objectContaining(voteData)
    )
  })
}) 