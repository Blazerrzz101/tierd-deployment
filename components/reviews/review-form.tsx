"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Product } from "@/types"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { StarRating } from "./star-rating"
import { toast } from "sonner"

const reviewSchema = z.object({
  productId: z.string().min(1, "Please select a product"),
  rating: z.number().min(1).max(5),
  title: z.string().min(1, "Title is required").max(100),
  content: z.string().min(10, "Review must be at least 10 characters").max(1000),
})

interface ReviewFormProps {
  products: Product[]
  onSubmit: (review: any) => void
}

export function ReviewForm({ products, onSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  
  const form = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      productId: "",
      rating: 0,
      title: "",
      content: "",
    },
  })

  const handleSubmit = (values: z.infer<typeof reviewSchema>) => {
    const newReview = {
      id: Math.random().toString(36).substr(2, 9),
      ...values,
      helpfulCount: 0,
      createdAt: new Date().toISOString(),
      user: {
        name: "Anonymous User",
        image: "",
      },
    }

    onSubmit(newReview)
    form.reset()
    setRating(0)
    toast.success("Review submitted successfully!")
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-4 space-y-6">
        <FormField
          control={form.control}
          name="productId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rating</FormLabel>
              <FormControl>
                <StarRating
                  rating={rating}
                  onRate={(value) => {
                    setRating(value)
                    field.onChange(value)
                  }}
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
                <Input placeholder="Summary of your review" {...field} />
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
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Submit Review
        </Button>
      </form>
    </Form>
  )
}