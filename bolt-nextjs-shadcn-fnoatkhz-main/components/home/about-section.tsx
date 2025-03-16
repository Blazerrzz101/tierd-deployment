"use client"

import { motion } from "framer-motion"
import { Trophy, Users, Star } from "lucide-react"

export function AboutSection() {
  const features = [
    {
      icon: Trophy,
      title: "Community-Driven Rankings",
      description: "Real rankings from real gamers. Our community votes and reviews determine the best gear."
    },
    {
      icon: Users,
      title: "Expert Community",
      description: "Connect with passionate gamers and pros who share their experiences and insights."
    },
    {
      icon: Star,
      title: "Unbiased Reviews",
      description: "Authentic reviews from verified users help you make informed decisions."
    }
  ]

  return (
    <section className="bg-gradient-to-b from-background to-background/80 py-24">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">About Tier'd</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tier'd is your destination for discovering the best gaming gear, ranked and reviewed by the gaming community. We believe in the power of collective experience to guide better purchasing decisions.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className="text-center"
            >
              <div className="mb-6 inline-block rounded-full bg-primary/10 p-4">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}