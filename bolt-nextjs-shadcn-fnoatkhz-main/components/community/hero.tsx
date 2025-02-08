"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { MessageSquare, Star, Users } from "lucide-react"

export function CommunityHero() {
  const stats = [
    { label: "Active Members", value: "2.4k", icon: Users },
    { label: "Reviews Today", value: "156", icon: Star },
    { label: "Discussions", value: "892", icon: MessageSquare }
  ]

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-background to-background/50 py-16">
      <div className="container relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h1 className="text-4xl font-bold">Join the Conversation. Shape the Rankings.</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Connect with fellow gamers, share your insights, and help build the most trusted gaming gear rankings.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg">Start a Discussion</Button>
            <Button size="lg" variant="outline">Write a Review</Button>
          </div>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-center gap-4 rounded-lg border bg-card p-6"
            >
              <stat.icon className="h-6 w-6 text-primary" />
              <div className="text-center">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}