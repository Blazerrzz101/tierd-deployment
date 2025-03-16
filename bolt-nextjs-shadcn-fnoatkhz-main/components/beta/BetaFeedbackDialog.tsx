"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BetaFeedback } from "@/lib/feedback/BetaFeedback"
import { FeedbackSubmission } from "@/lib/feedback/types"
import { toast } from "sonner"
import { FeedbackForm } from "./feedback/FeedbackForm"

interface BetaFeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BetaFeedbackDialog({ open, onOpenChange }: BetaFeedbackDialogProps) {
  const handleSubmit = (data: FeedbackSubmission) => {
    try {
      const feedbackManager = BetaFeedback.getInstance()
      feedbackManager.submitFeedback(data)
      toast.success("Thank you for your feedback!")
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to submit feedback:", error)
      toast.error("Failed to submit feedback. Please try again.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Your Feedback</DialogTitle>
        </DialogHeader>
        <FeedbackForm onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  )
}