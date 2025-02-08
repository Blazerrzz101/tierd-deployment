"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Edit, Users } from "lucide-react"

export function ReviewsHero() {
  return (
    <div className="hero-gradient relative overflow-hidden py-16">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight">
            Gaming Insights from{" "}
            <span className="text-gradient">Real Gamers!</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Share your expertise or find your next gaming upgrade
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button size="lg" className="button-gradient">
              <Edit className="mr-2 h-4 w-4" />
              Write a Review
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="button-outline-gradient"
            >
              <Users className="mr-2 h-4 w-4" />
              Join 5,000+ Gamers
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}