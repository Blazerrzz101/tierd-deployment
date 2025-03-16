"use client"

import { motion } from "framer-motion"
import { Search, ThumbsUp, Trophy } from "lucide-react"

const steps = [
  {
    icon: Search,
    title: "Browse Products",
    description: "Explore our curated selection of gaming accessories across multiple categories."
  },
  {
    icon: ThumbsUp,
    title: "Vote & Review",
    description: "Share your experience and help others make informed decisions."
  },
  {
    icon: Trophy,
    title: "Community Ranks",
    description: "See what the community considers the best gear for your gaming setup."
  }
]

export function HowItWorks() {
  return (
    <div className="space-y-12">
      <div className="text-center">
        <h2 className="text-3xl font-bold">How It Works</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Join our community-driven platform to discover the best gaming gear
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <step.icon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
            <p className="text-muted-foreground">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}