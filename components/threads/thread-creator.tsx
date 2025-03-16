'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { ProductQuickView } from './product-quick-view'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Image as ImageIcon } from 'lucide-react'
import { ThreadManager } from '@/lib/supabase/thread-manager'

interface MentionedProduct {
  id: string
  name: string
  image_url: string | null
  category: string
  price: number | null
}

// Base64 encoded transparent placeholder
const PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

export function ThreadCreator() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [content, setContent] = useState('')
  const [mentionPosition, setMentionPosition] = useState<{ top: number; left: number } | null>(null)
  const [showProductQuickView, setShowProductQuickView] = useState(false)
  const [mentionedProducts, setMentionedProducts] = useState<MentionedProduct[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { user } = useAuth()

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setError(null)
    const newContent = e.target.value
    setContent(newContent)

    // Check for @ symbol
    const lastAtIndex = newContent.lastIndexOf('@')
    if (lastAtIndex !== -1 && !newContent.substring(lastAtIndex).includes(' ')) {
      const rect = e.target.getBoundingClientRect()
      const textBeforeCaret = newContent.substring(0, e.target.selectionStart)
      const lineBreaks = (textBeforeCaret.match(/\n/g) || []).length
      const lineHeight = parseInt(getComputedStyle(e.target).lineHeight)
      
      setMentionPosition({
        top: rect.top + lineBreaks * lineHeight - 220,
        left: rect.left + (textBeforeCaret.length % 80) * 8
      })
      setShowProductQuickView(true)
    } else {
      setShowProductQuickView(false)
      setMentionPosition(null)
    }
  }

  const handleProductSelect = (product: MentionedProduct) => {
    const currentContent = content
    const lastAtIndex = currentContent.lastIndexOf('@')
    const newContent = currentContent.substring(0, lastAtIndex) + `@${product.name} `
    setContent(newContent)
    setShowProductQuickView(false)
    setMentionPosition(null)
    setMentionedProducts([...mentionedProducts, product])
    
    // Focus back on textarea and place cursor at end
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.setSelectionRange(newContent.length, newContent.length)
    }
  }

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to create a thread')
      return
    }

    if (!content.trim()) {
      toast.error('Please enter some content for your thread')
      return
    }

    setIsSubmitting(true)

    try {
      await ThreadManager.createThread(
        content,
        user.id,
        mentionedProducts.map(p => p.id)
      )

      toast.success('Thread created successfully')
      setContent('')
      setMentionedProducts([])
      setIsExpanded(false)
    } catch (err) {
      console.error('Error creating thread:', err)
      toast.error('Failed to create thread. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFocus = () => {
    setIsExpanded(true)
  }

  return (
    <Card className={cn(
      "w-full transition-all duration-300",
      isExpanded ? "p-4" : "p-2"
    )}>
      <div className="relative space-y-4">
        <Textarea
          ref={inputRef}
          placeholder="Ask anything... Use @ to mention products"
          value={content}
          onChange={handleInputChange}
          onFocus={handleFocus}
          className={cn(
            "resize-none transition-all duration-300",
            isExpanded ? "h-32" : "h-12",
            "focus:ring-2 focus:ring-primary bg-background/50",
            content.includes('@') && "ring-2 ring-primary/50"
          )}
          disabled={isSubmitting}
        />

        {showProductQuickView && mentionPosition && (
          <div
            style={{
              position: 'absolute',
              top: `${mentionPosition.top}px`,
              left: `${mentionPosition.left}px`,
              zIndex: 50
            }}
          >
            <ProductQuickView onSelect={handleProductSelect} />
          </div>
        )}

        {mentionedProducts.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {mentionedProducts.map((product) => (
              <div
                key={product.id}
                className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
              >
                <div className="relative w-4 h-4 rounded-full overflow-hidden bg-muted">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = PLACEHOLDER_IMAGE;
                        img.className = 'hidden';
                        e.currentTarget.parentElement?.querySelector('.placeholder-icon')?.classList.remove('hidden');
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-3 h-3 text-muted-foreground" />
                    </div>
                  )}
                  <div className="placeholder-icon hidden absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="w-3 h-3 text-muted-foreground" />
                  </div>
                </div>
                <span>@{product.name}</span>
              </div>
            ))}
          </div>
        )}

        {isExpanded && (
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsExpanded(false)
                setContent('')
                setMentionedProducts([])
                setError(null)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Thread'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
} 