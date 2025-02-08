'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { ProductQuickView } from './product-quick-view'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Image as ImageIcon } from 'lucide-react'

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
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { user } = useAuth()

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
      setMentionPosition(null)  // Reset position
    }
  }

  const handleProductSelect = (product: MentionedProduct) => {
    const currentContent = content
    const lastAtIndex = currentContent.lastIndexOf('@')
    const newContent = currentContent.substring(0, lastAtIndex) + `@${product.name} `
    setContent(newContent)
    setShowProductQuickView(false)
    setMentionPosition(null)  // Reset position
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
      const { data: thread, error: threadError } = await supabase
        .from('threads')
        .insert([
          {
            content,
            user_id: user.id,
            mentioned_products: mentionedProducts.map(p => p.id)
          }
        ])
        .select()
        .single()

      if (threadError) throw threadError

      // Create thread-product relationships
      if (mentionedProducts.length > 0) {
        const { error: relationError } = await supabase
          .from('thread_products')
          .insert(
            mentionedProducts.map(product => ({
              thread_id: thread.id,
              product_id: product.id
            }))
          )

        if (relationError) throw relationError
      }

      toast.success('Thread created successfully')
      setContent('')
      setMentionedProducts([])
      setIsExpanded(false)
    } catch (error) {
      console.error('Error creating thread:', error)
      toast.error('Failed to create thread. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFocus = () => {
    setIsExpanded(true)
  }

  // Helper function to get caret coordinates
  const getCaretCoordinates = (element: HTMLTextAreaElement) => {
    const position = element.selectionEnd || 0
    const div = document.createElement('div')
    const styles = getComputedStyle(element)
    const properties = [
      'fontFamily',
      'fontSize',
      'fontWeight',
      'wordWrap',
      'whiteSpace',
      'padding'
    ] as const

    properties.forEach((prop) => {
      div.style[prop] = styles.getPropertyValue(prop)
    })

    div.textContent = element.value.substring(0, position)
    div.style.visibility = 'hidden'
    div.style.position = 'absolute'
    div.style.whiteSpace = 'pre-wrap'

    document.body.appendChild(div)
    const coordinates = {
      top: div.offsetHeight,
      left: div.offsetWidth
    }
    document.body.removeChild(div)

    return coordinates
  }

  return (
    <Card className={`w-full transition-all duration-300 ${isExpanded ? 'p-4' : 'p-2'}`}>
      <div className="relative">
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
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {user ? 'Posting as ' + user.email : 'Sign in to post'}
            </p>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !user}
              className="relative overflow-hidden group"
            >
              <span className="relative z-10">
                {isSubmitting ? 'Posting...' : 'Post Thread'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
} 