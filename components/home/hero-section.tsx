"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Star, Search } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export function HeroSection() {
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 300], [1, 0])
  const scale = useTransform(scrollY, [0, 300], [1, 0.8])
  const y = useTransform(scrollY, [0, 300], [0, 100])

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] }
  }

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 animated-gradient" />
      
      {/* Animated Gradient Orbs */}
      <motion.div
        className="pointer-events-none absolute -left-1/4 top-0 h-[800px] w-[800px] rounded-full bg-blue-500/10 blur-[120px]"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      
      <motion.div
        className="pointer-events-none absolute right-0 top-1/4 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[100px]"
        animate={{
          x: [0, -50, 0],
          y: [0, 100, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

      {/* Grid Pattern Overlay */}
      <div 
        className="pointer-events-none absolute inset-0 bg-[url('/grid.svg')] bg-fixed opacity-5"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black, transparent)'
        }}
      />

      {/* Content */}
      <motion.div 
        style={{ opacity, scale, y }}
        className="relative mx-auto max-w-7xl px-6 pt-32 sm:px-8 sm:pt-40"
      >
        <motion.div 
          variants={stagger}
          initial="initial"
          animate="animate"
          className="grid gap-12 lg:grid-cols-2 lg:gap-16"
        >
          {/* Text Content */}
          <div className="flex flex-col justify-center">
            <motion.div variants={fadeInUp} className="space-y-8">
              <div className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 shadow-lg shadow-blue-500/10">
                <span className="text-sm font-medium text-blue-300">New: AI-Powered Rankings</span>
                <span className="ml-2 rounded-full bg-blue-500/20 px-1.5 py-0.5 text-xs text-blue-300">Beta</span>
              </div>
              
              <motion.h1 
                className="heading-1"
                variants={fadeInUp}
              >
                Find Your Perfect
                <br />
                <motion.span 
                  className="gradient-text"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                  style={{ backgroundSize: "200% auto" }}
                >
                  Gaming Setup
                </motion.span>
              </motion.h1>

              <motion.p 
                variants={fadeInUp}
                className="body-large max-w-xl"
              >
                Discover and compare the best gaming gear, ranked by real streamers and pro gamers. Make informed decisions with authentic reviews and real-time rankings.
              </motion.p>

              {/* Search Bar */}
              <motion.div
                variants={fadeInUp}
                className="mt-8"
              >
                <div className="search-bar">
                  <Search className="h-6 w-6 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Find the best gaming mouse, keyboard, etc."
                    className="flex-1"
                  />
                  <Button 
                    size="sm"
                    className="interactive bg-primary text-primary-foreground"
                  >
                    Search
                  </Button>
                </div>
              </motion.div>

              <motion.div 
                variants={fadeInUp}
                className="flex items-center gap-6"
              >
                <Link href="/products">
                  <Button 
                    size="lg" 
                    className="interactive group relative h-14 overflow-hidden bg-primary px-8 text-lg font-medium shadow-lg shadow-primary/20"
                  >
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500"
                      animate={{
                        x: ["-100%", "100%"],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatType: "reverse",
                      }}
                      style={{ opacity: 0.5 }}
                    />
                    <span className="relative flex items-center">
                      Explore Products
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Button>
                </Link>
                <Link href="/about" className="interactive flex items-center text-lg font-medium text-muted-foreground transition-all hover:text-foreground">
                  Learn More
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </motion.div>

              <motion.div 
                variants={fadeInUp}
                className="mt-4"
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div 
                        key={i} 
                        className="h-10 w-10 rounded-full border-2 border-background bg-gradient-to-br from-blue-500/20 via-blue-600/20 to-blue-700/20 p-0.5"
                      >
                        <div className="h-full w-full rounded-full bg-muted" />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-medium text-foreground">4.9/5</span> from over 10k reviews
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-6">
                  {["Twitch", "YouTube", "TikTok"].map((platform) => (
                    <motion.div
                      key={platform}
                      variants={fadeInUp}
                      whileHover={{ scale: 1.05 }}
                      className="interactive text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {platform}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Featured Product Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="relative flex items-center justify-center lg:justify-end"
          >
            <motion.div 
              className="glass group relative aspect-square w-full max-w-xl overflow-hidden rounded-3xl p-8"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-blue-600/10" />
              <div className="absolute inset-0 bg-grid-white/5 bg-[size:3rem_3rem] [mask-image:radial-gradient(white,transparent_85%)]" />
              
              <motion.div 
                className="relative flex h-full flex-col items-center justify-center"
                initial="initial"
                animate="animate"
                variants={stagger}
              >
                <motion.div 
                  className="ranking-badge"
                  variants={fadeInUp}
                  whileHover={{ scale: 1.1 }}
                >
                  #1
                </motion.div>
                <motion.div
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05 }}
                  className="relative h-80 w-80"
                >
                  <Image
                    src="/featured-product.png"
                    alt="Featured Gaming Product"
                    fill
                    className="object-contain transition-transform duration-500 group-hover:scale-110"
                  />
                </motion.div>
                <motion.div 
                  className="mt-6 text-center"
                  variants={fadeInUp}
                >
                  <h3 className="text-xl font-semibold">Most Popular Gaming Mouse</h3>
                  <p className="mt-2 text-muted-foreground">Voted by 10,000+ streamers</p>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}