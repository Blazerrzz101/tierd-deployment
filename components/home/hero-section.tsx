"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Star, ChevronRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { SearchBar } from "./search-bar"

export function HeroSection() {
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 400, 800], [1, 1, 0])
  const scale = useTransform(scrollY, [0, 400, 800], [1, 1, 0.8])
  const y = useTransform(scrollY, [0, 400, 800], [0, 0, 100])

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
      {/* Subtle Grid Background */}
      <div 
        className="absolute inset-0 bg-[url('/grid.svg')] bg-fixed opacity-[0.02] pointer-events-none"
        style={{
          maskImage: 'radial-gradient(circle at center, black, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 80%)'
        }}
      />
      
      {/* Search Bar - Persistent */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto">
          <SearchBar />
        </div>
      </div>
      
      {/* Professional Gradient Orbs */}
      <motion.div
        className="pointer-events-none absolute -left-1/4 top-0 h-[800px] w-[800px] rounded-full bg-primary/5 blur-[120px]"
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
        className="pointer-events-none absolute right-0 top-1/4 h-[600px] w-[600px] rounded-full bg-secondary/5 blur-[100px]"
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
      
      <motion.div
        className="pointer-events-none absolute left-1/3 bottom-1/4 h-[400px] w-[400px] rounded-full bg-accent/5 blur-[80px]"
        animate={{
          x: [0, 30, 0],
          y: [0, -30, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: "reverse",
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
              {/* Professional Badge */}
              <div className="inline-flex items-center rounded-lg border border-white/10 bg-black/30 px-4 py-2 shadow-xl backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                  <span className="text-sm font-medium text-white">Enterprise-Grade Ranking Platform</span>
                </div>
                <span className="ml-2 rounded-full bg-primary/20 px-1.5 py-0.5 text-xs text-primary">Professional</span>
              </div>
              
              {/* Main Title */}
              <motion.h1 
                className="heading-1"
                variants={fadeInUp}
              >
                <span className="block text-foreground/80">Discover Elite</span>
                <motion.span 
                  className="gradient-text"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                  style={{ backgroundSize: "200% auto" }}
                >
                  Gaming Hardware
                </motion.span>
              </motion.h1>

              {/* Description */}
              <motion.p 
                variants={fadeInUp}
                className="body-large max-w-xl text-foreground/70"
              >
                Tier'd delivers data-driven insights to identify top-performing gaming peripherals for discerning professionals and competitive players. Our proprietary ranking algorithm combines expert evaluations with real-world performance metrics.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div 
                variants={fadeInUp}
                className="flex items-center gap-6"
              >
                <Link href="/products">
                  <Button 
                    size="lg" 
                    className="interactive group relative h-14 overflow-hidden bg-primary px-8 text-lg font-medium shadow-lg"
                  >
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary to-primary/80"
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
                      Browse Elite Products
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Button>
                </Link>
                <Link href="/about" className="interactive flex items-center text-lg font-medium text-muted-foreground transition-all hover:text-foreground">
                  Platform Overview
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div 
                variants={fadeInUp}
                className="mt-8 border-t border-white/5 pt-8"
              >
                <p className="text-sm font-medium text-foreground/60 mb-4">Trusted by professional players and industry leaders</p>
                
                <div className="flex flex-wrap items-center gap-8">
                  {/* Trust logos - using placeholder divs for now */}
                  <div className="h-8 w-24 rounded bg-white/5 backdrop-blur-sm"></div>
                  <div className="h-8 w-20 rounded bg-white/5 backdrop-blur-sm"></div>
                  <div className="h-8 w-28 rounded bg-white/5 backdrop-blur-sm"></div>
                  <div className="h-8 w-16 rounded bg-white/5 backdrop-blur-sm"></div>
                </div>
              </motion.div>
            </motion.div>
          </div>
          
          {/* Image/Visual Area */}
          <motion.div variants={fadeInUp} className="relative flex items-center justify-center">
            <div className="relative w-full max-w-lg mx-auto">
              {/* Card Stack */}
              <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-primary to-secondary opacity-10 blur-xl"></div>
              <div className="relative bg-card-background border border-white/10 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Top Rated Hardware</h3>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <div className="h-2 w-2 rounded-full bg-secondary"></div>
                    <div className="h-2 w-2 rounded-full bg-accent"></div>
                  </div>
                </div>
                
                {/* Product Preview Cards */}
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 * i, duration: 0.5 }}
                      className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20"></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">Premium Gaming {i === 1 ? 'Mouse' : i === 2 ? 'Keyboard' : 'Headset'}</h4>
                        <div className="flex items-center mt-1">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`h-3 w-3 ${star <= 4 ? 'text-secondary fill-secondary' : 'text-gray-500'}`} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground ml-1">4.8</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-xs font-semibold text-secondary">$149.99</div>
                    </motion.div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Real-time data analysis</span>
                    <Button variant="outline" size="sm" className="text-xs h-8 rounded-lg border-white/10 bg-white/5">
                      View All
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}