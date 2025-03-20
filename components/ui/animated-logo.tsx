"use client"

import React, { useEffect, useState } from "react"
import { motion, useAnimation, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedLogoProps {
  className?: string
}

export function AnimatedLogo({ className }: AnimatedLogoProps) {
  const controls = useAnimation()
  const [hovered, setHovered] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    
    // Initial animation
    controls.start({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.23, 1, 0.32, 1] }
    })
  }, [controls])
  
  // Simple fallback if not mounted or any issues
  if (!mounted) return (
    <div className={cn("text-2xl font-bold", className)}>
      Tier'd
    </div>
  )
  
  return (
    <div
      className={cn("relative overflow-hidden h-10", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full opacity-0"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={hovered ? { opacity: 0.7, scale: 1.2 } : { opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.4 }}
        style={{
          background: "radial-gradient(circle, rgba(255,70,131,0.4) 0%, rgba(29,78,216,0.05) 100%)",
          filter: "blur(15px)",
        }}
      />
      
      {/* Main text */}
      <motion.div
        className="relative text-2xl font-bold bg-gradient-to-r from-primary via-white to-accent bg-clip-text text-transparent"
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={controls}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center">
          <div className="relative">
            {/* Particles */}
            <AnimatePresence>
              {hovered && (
                <>
                  <motion.div
                    className="absolute rounded-full w-1.5 h-1.5 bg-primary"
                    initial={{ opacity: 0, x: 0, y: 0 }}
                    animate={{ opacity: [0, 1, 0], x: -15, y: -15 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                  />
                  <motion.div
                    className="absolute rounded-full w-1 h-1 bg-accent"
                    initial={{ opacity: 0, x: 0, y: 0 }}
                    animate={{ opacity: [0, 1, 0], x: 10, y: -10 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, delay: 0.1 }}
                  />
                  <motion.div
                    className="absolute rounded-full w-1 h-1 bg-secondary"
                    initial={{ opacity: 0, x: 0, y: 0 }}
                    animate={{ opacity: [0, 1, 0], x: -8, y: 8 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                  />
                </>
              )}
            </AnimatePresence>
            
            <span className="mr-1">Tier</span>
            
            {/* Animated apostrophe */}
            <motion.span
              className="absolute top-0 right-[-2px] text-primary"
              animate={hovered ? { 
                y: [0, -3, 0],
                scale: [1, 1.2, 1],
                opacity: [1, 0.8, 1] 
              } : {}}
              transition={{ duration: 0.6, repeat: hovered ? Infinity : 0, repeatType: "reverse" }}
            >
              '
            </motion.span>
          </div>
          
          <span className="ml-1">d</span>
        </div>
        
        {/* Animated underline */}
        <motion.div
          className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-primary to-accent"
          initial={{ width: "0%" }}
          animate={hovered ? { width: "100%" } : { width: "0%" }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
      
      {/* Gaming badge that appears on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            className="absolute -top-5 right-0 text-xs bg-black/60 backdrop-blur-sm text-primary px-1.5 py-0.5 rounded-full border border-primary/30"
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            Gaming
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 