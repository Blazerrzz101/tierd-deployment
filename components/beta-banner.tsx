"use client"

import { useState, useEffect } from "react"
import { X, MessageCircle, AlertTriangle, ThumbsUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useSearchParams } from "next/navigation"

export function BetaBanner() {
  // Debug why changes aren't persisting
  console.log("BetaBanner component rendering - v3")
  
  const searchParams = useSearchParams()
  const [isVisible, setIsVisible] = useState(true)
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState("")
  const [feedbackType, setFeedbackType] = useState<"bug" | "suggestion" | null>(null)
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const { toast } = useToast()

  // Check URL parameter for dismiss state - this will work even if localStorage fails
  useEffect(() => {
    if (searchParams.get("hideBanner") === "true") {
      console.log("Hiding banner due to URL parameter")
      setIsVisible(false)
    }
  }, [searchParams])

  // Check localStorage AND sessionStorage on initial load
  useEffect(() => {
    const checkStorageForDismissal = () => {
      try {
        // First try localStorage
        const dismissedLocalStorage = localStorage.getItem("beta-banner-dismissed")
        if (dismissedLocalStorage === "true") {
          setIsVisible(false)
          return true
        }
        
        // Fallback to sessionStorage if localStorage didn't have the value
        const dismissedSessionStorage = sessionStorage.getItem("beta-banner-dismissed")
        if (dismissedSessionStorage === "true") {
          setIsVisible(false)
          return true
        }
        
        return false
      } catch (err) {
        console.error("Error accessing storage:", err)
        return false
      }
    }
    
    // Set a small timeout to ensure the component is fully mounted
    const timeoutId = setTimeout(() => {
      console.log("Running checkStorageForDismissal")
      checkStorageForDismissal()
    }, 300) // Increased timeout
    
    return () => clearTimeout(timeoutId)
  }, [])

  // Enhanced dismiss handler with multiple storage options and forced state update
  const handleDismiss = () => {
    console.log("Dismissing beta banner")
    try {
      // Try to use both localStorage and sessionStorage for redundancy
      localStorage.setItem("beta-banner-dismissed", "true")
      sessionStorage.setItem("beta-banner-dismissed", "true")
      console.log("Beta banner dismissed and saved to storage")
    } catch (err) {
      console.error("Error saving to storage:", err)
      try {
        // If localStorage fails, try sessionStorage as fallback
        sessionStorage.setItem("beta-banner-dismissed", "true")
      } catch (sessionErr) {
        console.error("Error saving to sessionStorage:", sessionErr)
      }
    } finally {
      // Always hide the banner regardless of storage success
      setIsVisible(false)
    }
  }
  
  const handleFeedbackSubmit = () => {
    if (!feedbackText.trim() || !feedbackType) {
      toast({
        title: "Please complete your feedback",
        description: "Both feedback type and message are required",
        variant: "destructive",
      })
      return
    }
    
    setFeedbackSubmitting(true)
    
    // Simulate sending feedback
    setTimeout(() => {
      setFeedbackSubmitting(false)
      setFeedbackDialogOpen(false)
      setFeedbackText("")
      setFeedbackType(null)
      
      toast({
        title: "Feedback submitted",
        description: "Thank you for helping us improve Tier'd!",
      })
    }, 1000)
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        exit={{ y: -100 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative bg-gradient-to-r from-[#ff4b26] to-[#ff9426] px-4 py-4 text-white shadow-lg"
      >
        <div className="container flex flex-col sm:flex-row sm:items-center justify-between">
          <div className="flex items-center mb-2 sm:mb-0">
            <div className="hidden sm:block mr-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-xl font-bold">β</span>
              </div>
            </div>
            
            <div>
              <p className="text-base font-medium mb-1">
                🎮 Welcome to the Tier'd Beta! (v3)
              </p>
              <p className="text-sm text-white/80">
                We're actively improving the platform. Your feedback matters!
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 bg-white/10 hover:bg-white/20 border-white/10 text-white"
              onClick={() => setFeedbackDialogOpen(true)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Send Feedback
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="h-9 bg-white/10 hover:bg-white/20 border-white/10 text-white"
              onClick={() => window.location.href = window.location.pathname + '?hideBanner=true'}
            >
              Try URL Param
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-white/20"
              onClick={handleDismiss}
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Pulsing animation effect */}
        <motion.div 
          className="absolute inset-0 bg-white/10 rounded-lg"
          animate={{ 
            opacity: [0, 0.1, 0],
            scale: [0.95, 1, 0.95]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      </motion.div>
      
      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Beta Feedback</DialogTitle>
            <DialogDescription>
              Help us improve Tier'd with your valuable feedback. Your insights directly impact our development.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex space-x-2">
              <Button
                variant={feedbackType === "bug" ? "default" : "outline"}
                size="sm"
                onClick={() => setFeedbackType("bug")}
                className="flex-1"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Report Bug
              </Button>
              <Button
                variant={feedbackType === "suggestion" ? "default" : "outline"}
                size="sm"
                onClick={() => setFeedbackType("suggestion")}
                className="flex-1"
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Suggestion
              </Button>
            </div>
            
            <Textarea
              placeholder="Share your feedback with us..."
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              className="min-h-[150px]"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFeedbackSubmit} disabled={feedbackSubmitting}>
              {feedbackSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatePresence>
  )
} 