"use client"

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
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FeedbackTypeSelect } from "./FeedbackTypeSelect"
import { FeedbackPrioritySelect } from "./FeedbackPrioritySelect"
import { submitBetaFeedback } from "@/lib/supabase/beta"
import { Icons } from "@/components/icons"
import { useState } from "react"

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'improvement']),
  description: z.string().min(10).max(500),
  priority: z.enum(['low', 'medium', 'high'])
})

export type FeedbackFormData = z.infer<typeof feedbackSchema>

interface FeedbackFormProps {
  onSubmit: (data: FeedbackFormData) => void
}

export function FeedbackForm({ onSubmit }: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema)
  })

  const handleSubmit = async (data: FeedbackFormData) => {
    setIsSubmitting(true)
    try {
      const success = await submitBetaFeedback(data)
      if (success) {
        onSubmit(data)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FeedbackTypeSelect control={form.control} />
        <FeedbackPrioritySelect control={form.control} />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your feedback in detail..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          )}
          Submit Feedback
        </Button>
      </form>
    </Form>
  )
}