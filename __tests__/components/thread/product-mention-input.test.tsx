import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductMentionInput } from '@/components/thread/product-mention-input'
import { supabase } from '@/lib/supabase/client'
import { vi } from 'vitest'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        ilike: jest.fn(() => ({
          limit: jest.fn().mockResolvedValue({
            data: [
              { id: '1', name: 'Product 1', url_slug: 'product-1' },
              { id: '2', name: 'Product 2', url_slug: 'product-2' }
            ]
          })
        }))
      }))
    }))
  }
}))

describe('ProductMentionInput', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly', () => {
    render(<ProductMentionInput onSubmit={mockOnSubmit} />)
    expect(screen.getByPlaceholder('Write your message...')).toBeInTheDocument()
    expect(screen.getByText('Send Message')).toBeInTheDocument()
  })

  it('handles text input correctly', async () => {
    render(<ProductMentionInput onSubmit={mockOnSubmit} />)
    const textarea = screen.getByPlaceholder('Write your message...')
    
    await userEvent.type(textarea, 'Hello world')
    expect(textarea).toHaveValue('Hello world')
  })

  it('shows product suggestions when typing @', async () => {
    render(<ProductMentionInput onSubmit={mockOnSubmit} />)
    const textarea = screen.getByPlaceholder('Write your message...')
    
    await userEvent.type(textarea, '@test')

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument()
      expect(screen.getByText('Test Category')).toBeInTheDocument()
    })
  })

  it('inserts product mention when selecting from suggestions', async () => {
    render(<ProductMentionInput onSubmit={mockOnSubmit} />)
    const textarea = screen.getByPlaceholder('Write your message...')
    
    await userEvent.type(textarea, '@test')
    
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('Test Product'))
    expect(textarea).toHaveValue('@Test Product')
  })

  it('submits message on button click', async () => {
    render(<ProductMentionInput onSubmit={mockOnSubmit} />)
    const textarea = screen.getByPlaceholder('Write your message...')
    const submitButton = screen.getByText('Send Message')
    
    await userEvent.type(textarea, 'Test message with @Test Product')
    await userEvent.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalledWith('Test message with @Test Product')
    expect(textarea).toHaveValue('')
  })

  it('submits message on Enter without shift', async () => {
    render(<ProductMentionInput onSubmit={mockOnSubmit} />)
    const textarea = screen.getByPlaceholder('Write your message...')
    
    await userEvent.type(textarea, 'Test message')
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })

    expect(mockOnSubmit).toHaveBeenCalledWith('Test message')
    expect(textarea).toHaveValue('')
  })

  it('does not submit on shift+Enter', async () => {
    render(<ProductMentionInput onSubmit={mockOnSubmit} />)
    const textarea = screen.getByPlaceholder('Write your message...')
    
    await userEvent.type(textarea, 'Test message')
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })

    expect(mockOnSubmit).not.toHaveBeenCalled()
    expect(textarea).toHaveValue('Test message')
  })

  it('disables input and button when disabled prop is true', () => {
    render(<ProductMentionInput onSubmit={mockOnSubmit} disabled={true} />)
    
    expect(screen.getByPlaceholder('Write your message...')).toBeDisabled()
    expect(screen.getByText('Send Message')).toBeDisabled()
  })

  it('uses custom placeholder when provided', () => {
    const customPlaceholder = 'Custom placeholder text'
    render(
      <ProductMentionInput
        onSubmit={mockOnSubmit}
        placeholder={customPlaceholder}
      />
    )
    
    expect(screen.getByPlaceholder(customPlaceholder)).toBeInTheDocument()
  })
}) 