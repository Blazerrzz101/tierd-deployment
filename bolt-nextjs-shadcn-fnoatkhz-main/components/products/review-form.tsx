"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/reviews/star-rating"
import { Icons } from "@/components/icons"

const reviewSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  content: z.string().min(10, "Review must be at least 10 characters").max(1000),
  rating: z.number().min(1).max(5)
})

interface ReviewFormProps {
  onSubmit: (data: z.infer<typeof reviewSchema>) => Promise<void>
  initialData?: z.infer<typeof reviewSchema>
}

export function ReviewForm({ onSubmit, initialData }: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: initialData || {
      title: "",
      content: "",
      rating: 0
    }
  })

  const handleSubmit = async (values: z.infer<typeof reviewSchema>) => {
    setIsSubmitting(true)
    try {
      await onSubmit(values)
      form.reset()
    } finally {
      setIsSubmitting(false)
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
                <StarRating
                  rating={field.value}
                  onRate={(value) => field.onChange(value)}
                  interactive
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
                <Input placeholder="Summarize your review" {...field} />
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
                  placeholder="Share your experience with this product..."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          )}
          {initialData ? "Update Review" : "Submit Review"}
        </Button>
      </form>
    </Form>
  )
}