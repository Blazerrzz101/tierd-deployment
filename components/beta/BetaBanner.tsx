"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BetaFeedbackDialog } from "./BetaFeedbackDialog"

export function BetaBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const [showFeedback, setShowFeedback] = useState(false)

  if (!isVisible) return null

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative bg-primary/10 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                <p className="text-sm">
                  Welcome to our beta! Help us improve by providing feedback.
                  <Button 
                    variant="link" 
                    className="px-1 text-sm font-medium underline"
                    onClick={() => setShowFeedback(true)}
                  >
                    Share Feedback
                  </Button>
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsVisible(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BetaFeedbackDialog 
        open={showFeedback} 
        onOpenChange={setShowFeedback} 
      />
    </>
  )
}