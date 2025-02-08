"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { ThumbsUp, ThumbsDown } from "lucide-react"

export function RankingSystemPreview() {
  return (
    <div className="container py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-4xl"
      >
        <div className="relative aspect-[16/9] overflow-hidden rounded-lg border">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-orange-500/20 to-yellow-500/20" />
          
          {/* Example Product Card */}
          <div className="absolute inset-x-0 bottom-0 p-8">
            <div className="ranking-card">
              <div className="relative z-10 flex items-center gap-6">
                {/* Rank Number */}
                <div className="warm-text-gradient text-7xl font-bold">#1</div>

                {/* Product Image */}
                <div className="relative h-32 w-32 overflow-hidden rounded-lg">
                  <Image
                    src="/logitech-g502.jpg"
                    alt="Logitech G502"
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">Logitech G502</h3>
                  <p className="mt-1 text-muted-foreground">
                    The community's most trusted gaming mouse
                  </p>
                </div>

                {/* Voting Buttons */}
                <div className="flex items-center gap-4">
                  <button className="vote-button">
                    <ThumbsDown className="h-6 w-6" />
                  </button>
                  <span className="min-w-[3ch] text-center text-xl font-bold">
                    428
                  </span>
                  <button className="vote-button active">
                    <ThumbsUp className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold">Community-Driven Rankings</h2>
          <p className="mt-2 text-muted-foreground">
            Products are ranked based on real votes from gamers like you.
            Your voice matters in determining the best gaming gear.
          </p>
        </div>
      </motion.div>
    </div>
  )
}