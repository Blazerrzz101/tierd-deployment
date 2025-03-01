"use client"

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ParticlesProps {
  className?: string;
  quantity?: number;
  color?: 'primary' | 'secondary' | 'accent' | 'white';
  size?: 'small' | 'medium' | 'large';
  speed?: 'slow' | 'medium' | 'fast';
}

export function Particles({ 
  className, 
  quantity = 50, 
  color = 'primary',
  size = 'medium',
  speed = 'medium'
}: ParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: string;
    y: string;
    size: number;
    duration: number;
  }>>([])

  // Calculate particle size based on prop
  const getParticleSize = () => {
    switch(size) {
      case 'small': return { min: 1, max: 2 };
      case 'large': return { min: 2, max: 4 };
      default: return { min: 1.5, max: 3 }; // medium
    }
  }

  // Calculate animation speed based on prop
  const getAnimationSpeed = () => {
    switch(speed) {
      case 'slow': return { min: 8, max: 15 };
      case 'fast': return { min: 5, max: 8 };
      default: return { min: 6, max: 12 }; // medium
    }
  }

  // Get color class based on prop
  const getColorClass = () => {
    switch(color) {
      case 'secondary': return 'bg-secondary/30';
      case 'accent': return 'bg-accent/30';
      case 'white': return 'bg-white/20';
      default: return 'bg-primary/30'; // primary
    }
  }

  useEffect(() => {
    const sizeRange = getParticleSize();
    const speedRange = getAnimationSpeed();
    
    // Generate particles
    const newParticles = Array.from({ length: quantity }, (_, index) => ({
      id: index,
      x: `${Math.random() * 100}%`,
      y: `${Math.random() * 100}%`,
      size: Math.random() * (sizeRange.max - sizeRange.min) + sizeRange.min,
      duration: Math.random() * (speedRange.max - speedRange.min) + speedRange.min,
    }));
    
    setParticles(newParticles);
  }, [quantity, size, speed]);

  const colorClass = getColorClass();

  return (
    <div 
      ref={containerRef} 
      className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}
      aria-hidden="true"
    >
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className={cn("absolute rounded-full", colorClass)}
          style={{
            left: particle.x,
            top: particle.y,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            filter: 'blur(1px)'
          }}
          initial={{ opacity: 0.2, y: 0 }}
          animate={{ 
            opacity: 0,
            y: -40
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "linear"
          }}
        />
      ))}
    </div>
  )
} 