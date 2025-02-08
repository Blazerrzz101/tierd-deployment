"use client"

import { supabase } from "./client"
import { FeedbackSubmission } from "../feedback/types"
import { toast } from "sonner"

export async function submitBetaFeedback(feedback: FeedbackSubmission) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    const { error } = await supabase
      .from("beta_feedback")
      .insert({
        user_id: user.id,
        type: feedback.type,
        description: feedback.description,
        priority: feedback.priority,
        status: "new"
      })

    if (error) throw error
    
    return true
  } catch (error) {
    console.error("Error submitting feedback:", error)
    toast.error("Failed to submit feedback")
    return false
  }
}

export async function getUserFeedback() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from("beta_feedback")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error
    
    return data
  } catch (error) {
    console.error("Error fetching user feedback:", error)
    return []
  }
}