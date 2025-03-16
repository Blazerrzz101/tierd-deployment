"use client"

import { useState, Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Stage } from "@react-three/drei"
import { Product } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ThumbsUp, ThumbsDown, ShoppingCart, RotateCw } from "lucide-react"
import { motion } from "framer-motion"
import { useVote } from "@/hooks/use-vote"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface ProductHeroProps {
  product: Product
}

export function ProductHero({ product }: ProductHeroProps) {
  const [is3DMode, setIs3DMode] = useState(false)
  const { product: currentProduct, vote } = useVote(product)

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Product Image/3D Model */}
      <Card className="relative aspect-square overflow-hidden">
        {is3DMode ? (
          <Canvas shadows dpr={[1, 2]} camera={{ fov: 45 }}>
            <Suspense fallback={null}>
              <Stage environment="city" intensity={0.6}>
                {/* Add your 3D model here */}
                <mesh>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color="white" />
                </mesh>
              </Stage>
              <OrbitControls autoRotate />
            </Suspense>
          </Canvas>
        ) : (
          <Image
            src={currentProduct.imageUrl}
            alt={currentProduct.name}
            fill
            className="object-cover"
            priority
          />
        )}
        <Button
          variant="outline"
          size="sm"
          className="absolute right-4 top-4 bg-background/80 backdrop-blur-sm"
          onClick={() => setIs3DMode(!is3DMode)}
        >
          <RotateCw className="mr-2 h-4 w-4" />
          {is3DMode ? "View Photo" : "View in 3D"}
        </Button>
      </Card>

      {/* Product Info */}
      <div className="space-y-6">
        <div>
          <Badge className="mb-2 bg-primary text-primary-foreground">
            Rank #{currentProduct.rank}
          </Badge>
          <h1 className="text-4xl font-bold">{currentProduct.name}</h1>
          <p className="mt-2 text-xl text-muted-foreground">
            ${currentProduct.price.toFixed(2)}
          </p>
        </div>

        <p className="text-lg text-muted-foreground">
          {currentProduct.description}
        </p>

        {/* Voting Section */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => vote("down")}
                className={cn(
                  "hover:border-red-500 hover:text-red-500",
                  currentProduct.userVote === "down" && "border-red-500 text-red-500"
                )}
              >
                <ThumbsDown className="mr-2 h-5 w-5" />
                Downvote
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => vote("up")}
                className={cn(
                  "hover:border-green-500 hover:text-green-500",
                  currentProduct.userVote === "up" && "border-green-500 text-green-500"
                )}
              >
                <ThumbsUp className="mr-2 h-5 w-5" />
                Upvote
              </Button>
            </div>
            <Button size="lg" className="warm-gradient text-white hover:opacity-90">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Buy Now
            </Button>
          </div>
          <div className="border-t bg-muted/50 px-6 py-3 text-sm text-muted-foreground">
            {currentProduct.votes.toLocaleString()} community votes
          </div>
        </Card>
      </div>
    </div>
  )
}