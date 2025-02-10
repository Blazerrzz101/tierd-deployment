"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { MainLayout } from "@/components/home/main-layout"
import { SearchBar } from "@/components/search/search-bar"
import { RankingList } from "@/components/rankings/ranking-list"
import { categories } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Search, TrendingUp, Monitor, Keyboard, Mouse, Headphones } from "lucide-react"
import { LucideIcon } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

type CategoryId = 'gaming-mice' | 'keyboards' | 'monitors' | 'headsets'

const categoryIcons: Record<CategoryId, LucideIcon> = {
  'gaming-mice': Mouse,
  'keyboards': Keyboard,
  'monitors': Monitor,
  'headsets': Headphones,
}

const categoryGradients: Record<CategoryId, string> = {
  'gaming-mice': 'from-blue-900/50 to-blue-800/10',
  'keyboards': 'from-purple-900/50 to-purple-800/10',
  'monitors': 'from-emerald-900/50 to-emerald-800/10',
  'headsets': 'from-amber-900/50 to-amber-800/10',
}

// Add mouse-following particle system
interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  life: number
}

export function MainContent() {
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  
  // Parallax effects
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0])
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.95])
  const heroY = useTransform(scrollY, [0, 300], [0, 50])
  
  const [particles, setParticles] = useState<Particle[]>([])
  const [mouseTrail, setMouseTrail] = useState<{ x: number; y: number }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  // Enhanced mouse tracking with particle generation
  const generateParticle = useCallback((x: number, y: number): Particle => ({
    x,
    y,
    size: Math.random() * 3 + 1,
    speedX: (Math.random() - 0.5) * 2,
    speedY: (Math.random() - 0.5) * 2,
    life: 1
  }), [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100
      setMousePosition({ x, y })

      // Add particles on mouse move
      if (Math.random() > 0.8) { // Only add particles sometimes for performance
        setParticles(prev => [...prev, generateParticle(e.clientX, e.clientY)]
          .slice(-20)) // Limit number of particles
      }

      // Update mouse trail
      setMouseTrail(prev => [...prev, { x: e.clientX, y: e.clientY }]
        .slice(-10)) // Keep last 10 positions
    }

    // Update particles
    const updateParticles = () => {
      setParticles(prev => 
        prev.map(p => ({
          ...p,
          x: p.x + p.speedX,
          y: p.y + p.speedY,
          life: p.life - 0.02
        })).filter(p => p.life > 0)
      )
    }

    const particleInterval = setInterval(updateParticles, 16) // 60fps

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      clearInterval(particleInterval)
    }
  }, [generateParticle])

  // Search focus handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      const response = await fetch('/api/fix-permissions', { method: 'POST' })
      if (!response.ok) {
        throw new Error('Failed to fix permissions')
      }
      window.location.reload()
    } catch (err) {
      console.error('Error retrying:', err)
      setError('Failed to fix the issue. Please try again later.')
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <MainLayout>
      {error && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-2">Error Loading Data</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button 
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full"
            >
              {isRetrying ? 'Fixing...' : 'Try to Fix'}
            </Button>
          </div>
        </div>
      )}

      {/* Hero Section with Enhanced Parallax */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Dynamic background gradient with pulse */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-b from-black via-black to-transparent"
          animate={{
            background: [
              `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,75,38,0.2), transparent 50%) linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0.8))`,
              `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,75,38,0.15), transparent 45%) linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0.8))`,
              `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,75,38,0.2), transparent 50%) linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0.8))`
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Mouse trail effect */}
        <div className="absolute inset-0 pointer-events-none">
          {mouseTrail.map((pos, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-[#ff4b26]"
              style={{ 
                left: pos.x, 
                top: pos.y,
                opacity: (i + 1) / mouseTrail.length * 0.3
              }}
              initial={false}
              animate={{
                scale: [1, 0],
                opacity: [0.3, 0]
              }}
              transition={{
                duration: 0.5,
                ease: "easeOut"
              }}
            />
          ))}
        </div>

        {/* Interactive particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((particle, i) => (
            <motion.div
              key={`p-${i}`}
              className="absolute w-1 h-1 rounded-full bg-[#ff4b26]"
              style={{
                left: particle.x,
                top: particle.y,
                width: particle.size,
                height: particle.size
              }}
              animate={{
                opacity: particle.life
              }}
              transition={{
                duration: 0.016, // Smooth 60fps animation
                ease: "linear"
              }}
            />
          ))}
        </div>

        <div className="container relative z-10 flex flex-col items-center">
          <motion.div
            style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
            className="w-full max-w-4xl mx-auto text-center"
          >
            {/* Hero Content with Enhanced Typography */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1 className="text-6xl font-bold tracking-tighter sm:text-7xl md:text-8xl lg:text-9xl mb-8">
                Gaming Gear
                <motion.span 
                  className="block bg-gradient-to-r from-[#ff4b26] to-[#ff9426] bg-clip-text text-transparent"
                  animate={{ 
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{ 
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  Ranked by Gamers
                </motion.span>
              </h1>
              
              <p className="mx-auto max-w-2xl text-gray-400 text-lg md:text-xl font-light leading-relaxed mb-12">
                Join our community to discover, rank, and discuss the best gaming gear. 
                Find top-rated products trusted by gamers worldwide.
              </p>

              {/* Enhanced Search Bar with Autocomplete */}
              <div 
                ref={searchRef}
                className="max-w-2xl mx-auto mb-12 relative"
                onFocus={() => setIsSearchFocused(true)}
              >
                <motion.div
                  animate={isSearchFocused ? {
                    boxShadow: "0 0 20px rgba(255,75,38,0.2)",
                    scale: 1.02
                  } : {
                    boxShadow: "none",
                    scale: 1
                  }}
                  transition={{ duration: 0.2 }}
                  className="relative"
                >
                  <SearchBar />
                  <AnimatePresence>
                    {isSearchFocused && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-lg rounded-lg border border-white/10 p-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-white/70">
                            <TrendingUp className="h-4 w-4" />
                            <span>Trending Searches</span>
                          </div>
                          {["Logitech G Pro X", "Razer Huntsman", "Samsung Odyssey"].map((term, i) => (
                            <motion.button
                              key={term}
                              className="w-full text-left px-3 py-2 rounded-md hover:bg-white/5 text-white/80 hover:text-white
                                       transition-colors flex items-center gap-2"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                            >
                              <Search className="h-4 w-4" />
                              {term}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-2 text-sm text-white/50">
                  <TrendingUp className="h-4 w-4" />
                  <span>Trending: Gaming Mice, RGB Keyboards, 4K Monitors</span>
                </div>
              </div>

              {/* Enhanced CTA Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  className="relative group bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-6 text-lg
                           hover:bg-white/20 hover:border-white/30 transition-all duration-300 overflow-hidden"
                >
                  <motion.span 
                    className="relative z-10 flex items-center gap-2"
                    animate={{
                      textShadow: [
                        "0 0 8px rgba(255,75,38,0)",
                        "0 0 8px rgba(255,75,38,0.5)",
                        "0 0 8px rgba(255,75,38,0)"
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    Start Ranking
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="h-5 w-5" />
                    </motion.div>
                  </motion.span>
                  <motion.div 
                    className="absolute inset-0 -z-10 bg-gradient-to-r from-[#ff4b26]/20 to-[#ff9426]/20"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.2, 0.3, 0.2]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Enhanced Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ 
            y: [0, 10, 0],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2
                         backdrop-blur-sm bg-white/5">
            <motion.div 
              className="w-1 h-1 rounded-full bg-white/50"
              animate={{ 
                y: [0, 16, 0],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
          </div>
        </motion.div>
      </section>

      {/* Main Content */}
      <section className="bg-black/95 backdrop-blur-sm border-t border-white/10">
        <div className="container py-16 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-6xl space-y-16"
          >
            {/* Categories */}
            <div className="space-y-8">
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-semibold">Browse Categories</h2>
                <p className="text-gray-400 text-sm">Select a category to explore top-ranked gaming gear</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map((category) => {
                  const Icon = categoryIcons[category.id as CategoryId]
                  return (
                    <motion.div
                      key={category.id}
                      whileHover={{ scale: 1.02 }}
                      className="relative"
                    >
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedCategory(category.id)}
                        className={`
                          relative w-full h-[100px] p-4 rounded-xl border overflow-hidden
                          transition-all duration-300 group
                          ${selectedCategory === category.id 
                            ? "border-[#ff4b26] bg-gradient-to-br from-[#ff4b26]/20 to-black" 
                            : `border-white/10 bg-gradient-to-br ${categoryGradients[category.id as CategoryId]} hover:border-white/20`}
                        `}
                      >
                        {/* Background Glow */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                        </div>

                        <div className="relative flex flex-col items-center gap-3">
                          <div className={`
                            w-10 h-10 rounded-lg flex items-center justify-center
                            transition-all duration-300 group-hover:scale-110
                            ${selectedCategory === category.id 
                              ? "text-[#ff4b26]" 
                              : "text-white/70 group-hover:text-white"}
                          `}>
                            {Icon && <Icon className="w-6 h-6" />}
                          </div>
                          
                          <span className={`
                            text-sm font-medium transition-all duration-300
                            ${selectedCategory === category.id 
                              ? "text-white" 
                              : "text-white/70 group-hover:text-white"}
                          `}>
                            {category.name}
                          </span>
                        </div>

                        {/* Hover Glow Effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#ff4b26]/0 via-[#ff4b26]/10 to-[#ff9426]/0 
                                      opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
                      </Button>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Rankings */}
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left space-y-2">
                  <h2 className="text-3xl font-semibold">Top Ranked Gear</h2>
                  <p className="text-gray-400">Community-voted best gaming products</p>
                </div>
                <Button 
                  variant="ghost" 
                  className="text-white/70 hover:text-white whitespace-nowrap"
                >
                  View All Rankings <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden w-full">
                <RankingList categoryId={selectedCategory} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </MainLayout>
  )
}