"use client"

import { motion } from "framer-motion"

interface MastheadBackgroundProps {
  variant?: 'default' | 'minimal' | 'gradient'
}

export function MastheadBackground({ variant = 'default' }: MastheadBackgroundProps) {
  const backgrounds = {
    default: {
      base: "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/90 via-gray-900 to-black",
      pattern: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
      size: "48px 48px"
    },
    minimal: {
      base: "bg-gradient-to-br from-gray-900 to-black",
      pattern: "linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.02) 25%, transparent 25%)",
      size: "60px 60px"
    },
    gradient: {
      base: "bg-gradient-to-br from-primary/5 via-gray-900 to-black",
      pattern: "radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, transparent 100%)",
      size: "100% 100%"
    }
  }

  const bg = backgrounds[variant]

  return (
    <div className="absolute inset-0">
      <div className={`absolute inset-0 ${bg.base}`}>
        <motion.div 
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          style={{
            backgroundImage: bg.pattern,
            backgroundSize: bg.size
          }}
        />
      </div>
    </div>
  )
}