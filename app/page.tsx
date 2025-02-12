"use client"

import { HeroSection } from "@/components/home/hero-section"
import { ProductRankings } from "@/components/home/product-rankings"
import { Particles } from "@/components/ui/particles"

export default function HomePage() {
  return (
    <>
      <div className="fixed inset-0 overflow-hidden">
        <Particles className="absolute inset-0" />
      </div>
      <HeroSection />
      
      {/* Product Rankings Section */}
      <section className="relative z-10 border-t border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto max-w-7xl px-6 py-24">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Top Ranked Gaming Gear
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Browse the highest rated products in each category, ranked by the gaming community
            </p>
          </div>
          <ProductRankings />
        </div>
      </section>
    </>
  )
}

