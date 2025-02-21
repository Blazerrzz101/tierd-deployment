"use client"

import { MainLayout } from "@/components/home/main-layout"
import { Button } from "@/components/ui/button"
import { Github, Twitter } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  return (
    <MainLayout>
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              About Tier'd
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Your community-driven platform for discovering and discussing gaming gear
            </p>
          </div>

          {/* Mission Statement */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-semibold">Our Mission</h2>
            <p className="mt-4 text-muted-foreground">
              Tier'd aims to revolutionize how gamers discover and evaluate gaming equipment. 
              By combining community insights with detailed product information, we help you 
              make informed decisions about your gaming setup.
            </p>
          </div>

          {/* Features */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/5 p-6">
              <h3 className="text-xl font-semibold">Community Rankings</h3>
              <p className="mt-2 text-muted-foreground">
                Real rankings from real gamers. Our community-driven voting system 
                ensures authentic and unbiased product recommendations.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-6">
              <h3 className="text-xl font-semibold">Product Discussions</h3>
              <p className="mt-2 text-muted-foreground">
                Engage in meaningful conversations about gaming gear. Share your experiences
                and learn from other community members.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-6">
              <h3 className="text-xl font-semibold">Detailed Reviews</h3>
              <p className="mt-2 text-muted-foreground">
                Access comprehensive product reviews and specifications to make
                informed purchasing decisions.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-6">
              <h3 className="text-xl font-semibold">Product Comparisons</h3>
              <p className="mt-2 text-muted-foreground">
                Compare different products side by side with our intuitive
                comparison tools and community insights.
              </p>
            </div>
          </div>

          {/* Beta Notice */}
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-6">
            <h2 className="text-xl font-semibold text-blue-400">Beta Version</h2>
            <p className="mt-2 text-blue-300/80">
              Tier'd is currently in beta. We're constantly improving and adding new features
              based on community feedback. Your input helps shape the future of our platform.
            </p>
          </div>

          {/* Contact/Social */}
          <div className="flex flex-col items-center space-y-4">
            <h2 className="text-2xl font-semibold">Connect With Us</h2>
            <div className="flex space-x-4">
              <Button variant="outline" size="lg" asChild>
                <Link href="https://github.com/yourusername/tierd" target="_blank">
                  <Github className="mr-2 h-5 w-5" />
                  GitHub
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="https://twitter.com/tierdapp" target="_blank">
                  <Twitter className="mr-2 h-5 w-5" />
                  Twitter
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
} 