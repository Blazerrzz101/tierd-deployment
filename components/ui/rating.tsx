import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingProps {
  value: number
  onValueChange: (value: number) => void
  max?: number
  readOnly?: boolean
  className?: string
}

export function Rating({
  value,
  onValueChange,
  max = 5,
  readOnly = false,
  className,
}: RatingProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: max }).map((_, index) => {
        const starValue = index + 1
        const filled = value >= starValue

        return (
          <button
            key={index}
            type="button"
            onClick={() => !readOnly && onValueChange(starValue)}
            className={cn(
              'focus-visible:ring-ring rounded-sm focus-visible:outline-none focus-visible:ring-2',
              readOnly ? 'cursor-default' : 'cursor-pointer'
            )}
            disabled={readOnly}
          >
            <Star
              className={cn(
                'h-5 w-5 transition-colors',
                filled
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-muted text-muted-foreground'
              )}
            />
          </button>
        )
      })}
    </div>
  )
} 