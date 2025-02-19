/** @jest-environment jsdom */
import { render, fireEvent, waitFor } from '@testing-library/react'
import { VoteButtons } from '@/components/vote-buttons'
import { VoteStats } from '@/components/products/vote-stats'
import { useVote } from '@/hooks/use-vote'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/auth/auth-store'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      upsert: jest.fn(),
      delete: jest.fn()
    })),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn()
    })),
    rpc: jest.fn(),
    removeChannel: jest.fn()
  }
}))

// Mock auth store
jest.mock('@/lib/auth/auth-store', () => ({
  useAuthStore: jest.fn()
}))

describe('Vote Buttons Component', () => {
  const mockProduct = {
    id: 'test-product',
    name: 'Test Product',
    votes: 0,
    user_vote: null
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders vote buttons correctly', () => {
    const onVote = jest.fn()
    const { getByRole } = render(
      <VoteButtons 
        product={mockProduct} 
        onVote={onVote}
        showTooltips={false}
      />
    )

    expect(getByRole('button', { name: /upvote/i })).toBeInTheDocument()
    expect(getByRole('button', { name: /downvote/i })).toBeInTheDocument()
  })

  test('calls onVote when upvote button is clicked', () => {
    const onVote = jest.fn()
    const { getByRole } = render(
      <VoteButtons 
        product={mockProduct} 
        onVote={onVote}
        showTooltips={false}
      />
    )

    fireEvent.click(getByRole('button', { name: /upvote/i }))
    expect(onVote).toHaveBeenCalledWith(mockProduct.id, 'upvote')
  })

  test('calls onVote when downvote button is clicked', () => {
    const onVote = jest.fn()
    const { getByRole } = render(
      <VoteButtons 
        product={mockProduct} 
        onVote={onVote}
        showTooltips={false}
      />
    )

    fireEvent.click(getByRole('button', { name: /downvote/i }))
    expect(onVote).toHaveBeenCalledWith(mockProduct.id, 'downvote')
  })

  test('shows active state for user votes', () => {
    const onVote = jest.fn()
    const votedProduct = { ...mockProduct, user_vote: 'upvote' }
    const { getByRole } = render(
      <VoteButtons 
        product={votedProduct} 
        onVote={onVote}
        showTooltips={false}
      />
    )

    expect(getByRole('button', { name: /upvote/i })).toHaveClass('active')
  })
})

describe('Voting System Integration', () => {
  const mockProduct = {
    id: '123',
    name: 'Test Product',
    upvotes: 10,
    downvotes: 5,
    userVote: null
  }

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Mock authenticated user
    ;(useAuthStore as jest.Mock).mockImplementation(() => ({
      isAuthenticated: true,
      user: { id: 'test-user' },
      checkAuth: jest.fn()
    }))
  })

  test('authenticated user can upvote', async () => {
    const onVote = jest.fn()
    const { getByRole } = render(
      <VoteButtons 
        product={mockProduct} 
        onVote={onVote}
        showTooltips={false}
      />
    )
    
    const upvoteButton = getByRole('button', { name: /upvote/i })
    fireEvent.click(upvoteButton)
    
    await waitFor(() => {
      expect(onVote).toHaveBeenCalledWith(mockProduct.id, 'upvote')
    })
  })

  test('vote stats update in real-time', async () => {
    const { getByText } = render(<VoteStats productId={mockProduct.id} />)
    
    // Simulate real-time update
    const channel = supabase.channel()
    channel.on.mock.calls[0][2]({
      new: {
        upvotes: 11,
        downvotes: 5
      }
    })
    
    await waitFor(() => {
      expect(getByText('11')).toBeInTheDocument()
    })
  })

  test('anonymous users cannot vote', async () => {
    // Mock unauthenticated user
    ;(useAuthStore as jest.Mock).mockImplementation(() => ({
      isAuthenticated: false,
      user: null,
      checkAuth: jest.fn()
    }))

    const onVote = jest.fn()
    const { getByRole } = render(
      <VoteButtons 
        product={mockProduct} 
        onVote={onVote}
        showTooltips={false}
      />
    )
    
    const upvoteButton = getByRole('button', { name: /upvote/i })
    fireEvent.click(upvoteButton)
    
    await waitFor(() => {
      expect(onVote).not.toHaveBeenCalled()
    })
  })

  test('user can change vote', async () => {
    const productWithVote = { ...mockProduct, userVote: 1 }
    const onVote = jest.fn()
    const { getByRole } = render(
      <VoteButtons 
        product={productWithVote} 
        onVote={onVote}
        showTooltips={false}
      />
    )
    
    const downvoteButton = getByRole('button', { name: /downvote/i })
    fireEvent.click(downvoteButton)
    
    await waitFor(() => {
      expect(onVote).toHaveBeenCalledWith(productWithVote.id, 'downvote')
    })
  })
}) 