"use client"

import { motion } from "framer-motion"
import { ThumbsUp, Users, Zap, Shield, Trophy, BarChart } from "lucide-react"

const features = [
  {
    icon: ThumbsUp,
    title: "Community-Driven Rankings",
    description: "Real votes from real gamers. Our rankings are determined by the gaming community, not paid reviews.",
    color: "blue"
  },
  {
    icon: Users,
    title: "Expert Contributors",
    description: "Input from professional gamers, streamers, and tech enthusiasts who know their gear.",
    color: "purple"
  },
  {
    icon: Zap,
    title: "Real-Time Updates",
    description: "Rankings update instantly as votes come in, keeping you up to date with the latest trends.",
    color: "yellow"
  },
  {
    icon: Shield,
    title: "Verified Reviews",
    description: "All votes and reviews are verified to ensure authentic, reliable rankings.",
    color: "green"
  },
  {
    icon: Trophy,
    title: "Category Leaders",
    description: "Easily find the top-rated products in each gaming gear category.",
    color: "orange"
  },
  {
    icon: BarChart,
    title: "Detailed Analytics",
    description: "In-depth statistics and trends for each product's performance over time.",
    color: "red"
  }
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.23, 1, 0.32, 1]
    }
  }
}

export function FeaturesSection() {
  return (
    <section className="relative overflow-hidden py-24">
      {/* Background Elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl">
          <div className="h-[400px] w-[800px] bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 opacity-30" />
        </div>
      </div>

      <div className="container relative z-10 mx-auto max-w-6xl px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center"
        >
          <motion.h2
            variants={itemVariants}
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Why Choose Tier'd?
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground"
          >
            We're building the most trusted platform for gaming gear rankings,
            powered by the community and backed by data.
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group relative rounded-2xl border bg-card p-8 hover:border-primary/50"
            >
              <div className={`mb-4 inline-block rounded-lg bg-${feature.color}-500/10 p-3`}>
                <feature.icon className={`h-6 w-6 text-${feature.color}-500`} />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
              <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 opacity-0 transition-opacity duration-500 group-hover:opacity-10" />
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto mt-24 max-w-4xl rounded-2xl border bg-card p-8"
        >
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <motion.div
              variants={itemVariants}
              className="text-center"
            >
              <div className="text-3xl font-bold text-primary">10K+</div>
              <div className="mt-2 text-sm text-muted-foreground">Active Users</div>
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="text-center"
            >
              <div className="text-3xl font-bold text-primary">50K+</div>
              <div className="mt-2 text-sm text-muted-foreground">Product Votes</div>
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="text-center"
            >
              <div className="text-3xl font-bold text-primary">1K+</div>
              <div className="mt-2 text-sm text-muted-foreground">Products Ranked</div>
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="text-center"
            >
              <div className="text-3xl font-bold text-primary">100+</div>
              <div className="mt-2 text-sm text-muted-foreground">Expert Contributors</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 