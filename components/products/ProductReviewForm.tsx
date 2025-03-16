import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Rating } from '@/components/ui/rating'

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(1, 'Title is required').max(100),
  content: z.string().min(10, 'Review must be at least 10 characters').max(1000),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
})

type ReviewFormData = z.infer<typeof reviewSchema>

interface ProductReviewFormProps {
  onSubmit: (data: ReviewFormData) => Promise<void>
  isSubmitting?: boolean
}

export function ProductReviewForm({ onSubmit, isSubmitting = false }: ProductReviewFormProps) {
  const [pros, setPros] = useState<string[]>([])
  const [cons, setCons] = useState<string[]>([])
  const [newPro, setNewPro] = useState('')
  const [newCon, setNewCon] = useState('')

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      title: '',
      content: '',
      pros: [],
      cons: [],
    },
  })

  const handleAddPro = () => {
    if (newPro.trim() && pros.length < 5) {
      setPros([...pros, newPro.trim()])
      setNewPro('')
      form.setValue('pros', [...pros, newPro.trim()])
    }
  }

  const handleAddCon = () => {
    if (newCon.trim() && cons.length < 5) {
      setCons([...cons, newCon.trim()])
      setNewCon('')
      form.setValue('cons', [...cons, newCon.trim()])
    }
  }

  const handleRemovePro = (index: number) => {
    const newPros = pros.filter((_, i) => i !== index)
    setPros(newPros)
    form.setValue('pros', newPros)
  }

  const handleRemoveCon = (index: number) => {
    const newCons = cons.filter((_, i) => i !== index)
    setCons(newCons)
    form.setValue('cons', newCons)
  }

  const handleSubmit = async (data: ReviewFormData) => {
    try {
      await onSubmit({
        ...data,
        pros,
        cons,
      })
      form.reset()
      setPros([])
      setCons([])
    } catch (error) {
      // Error handling is done in the parent component
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rating</FormLabel>
              <FormControl>
                <Rating
                  value={field.value}
                  onValueChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Review title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Review</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write your review here..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div>
            <FormLabel>Pros (Optional)</FormLabel>
            <div className="flex gap-2">
              <Input
                value={newPro}
                onChange={(e) => setNewPro(e.target.value)}
                placeholder="Add a pro"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddPro}
                disabled={!newPro.trim() || pros.length >= 5}
              >
                Add
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {pros.map((pro, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm"
                >
                  <span>{pro}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePro(index)}
                    className="ml-1 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <FormLabel>Cons (Optional)</FormLabel>
            <div className="flex gap-2">
              <Input
                value={newCon}
                onChange={(e) => setNewCon(e.target.value)}
                placeholder="Add a con"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddCon}
                disabled={!newCon.trim() || cons.length >= 5}
              >
                Add
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {cons.map((con, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm"
                >
                  <span>{con}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCon(index)}
                    className="ml-1 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </form>
    </Form>
  )
} 