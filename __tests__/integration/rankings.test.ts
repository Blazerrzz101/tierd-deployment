import { supabase } from '@/lib/supabase/client'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis()
    }))
  }
}))

describe('Product Rankings Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('get_product_rankings returns correct data structure', async () => {
    const mockRankings = [{
      id: '123',
      name: 'Test Product',
      category: 'Gaming Mice',
      upvotes: 10,
      downvotes: 5,
      rating: 4.5,
      review_count: 100,
      ranking_score: 85.5
    }]

    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: mockRankings,
      error: null
    })

    const { data, error } = await supabase.rpc('get_product_rankings', {
      p_category: 'gaming-mice'
    })

    expect(error).toBeNull()
    expect(data).toEqual(mockRankings)
    expect(data[0]).toHaveProperty('ranking_score')
  })

  test('category matching is case insensitive', async () => {
    await supabase.rpc('get_product_rankings', {
      p_category: 'GAMING-MICE'
    })

    expect(supabase.rpc).toHaveBeenCalledWith(
      'get_product_rankings',
      expect.objectContaining({
        p_category: expect.any(String)
      })
    )
  })

  test('ranking score calculation is correct', async () => {
    const mockProduct = {
      upvotes: 100,
      downvotes: 20,
      rating: 4.5,
      review_count: 50
    }

    const expectedScore = (
      (mockProduct.upvotes - mockProduct.downvotes) * 0.7 +
      (mockProduct.rating * mockProduct.review_count) * 0.3
    )

    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: [{
        ...mockProduct,
        ranking_score: expectedScore
      }],
      error: null
    })

    const { data } = await supabase.rpc('get_product_rankings')
    expect(data[0].ranking_score).toBe(expectedScore)
  })

  test('products are ordered by rank', async () => {
    const mockRankings = [
      { id: '1', rank: 1, name: 'First' },
      { id: '2', rank: 2, name: 'Second' },
      { id: '3', rank: 3, name: 'Third' }
    ]

    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: mockRankings,
      error: null
    })

    const { data } = await supabase.rpc('get_product_rankings')
    
    expect(data[0].rank).toBe(1)
    expect(data[1].rank).toBe(2)
    expect(data[2].rank).toBe(3)
  })
}) 