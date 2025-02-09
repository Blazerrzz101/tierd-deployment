import { useEffect, useRef } from 'react'
import { motion, useAnimation, useInView } from 'framer-motion'

interface Particle {
  x: number
  y: number
  size: number
  alpha: number
  speed: number
}

export function Particles() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef)
  const controls = useAnimation()

  useEffect(() => {
    if (!isInView) return

    const particles: Particle[] = Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      alpha: Math.random() * 0.5 + 0.2,
      speed: Math.random() * 0.5 + 0.2
    }))

    particles.forEach((particle, i) => {
      controls.start(`particle${i}`, {
        y: [particle.y, particle.y - 20],
        opacity: [particle.alpha, 0],
        transition: {
          duration: particle.speed * 10,
          repeat: Infinity,
          ease: "linear",
          delay: Math.random() * 5
        }
      })
    })
  }, [isInView, controls])

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          custom={i}
          animate={controls}
          variants={{
            [`particle${i}`]: {}
          }}
          className="absolute w-1 h-1 rounded-full bg-[#ff4b26]"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            filter: 'blur(1px)'
          }}
        />
      ))}
    </div>
  )
} 