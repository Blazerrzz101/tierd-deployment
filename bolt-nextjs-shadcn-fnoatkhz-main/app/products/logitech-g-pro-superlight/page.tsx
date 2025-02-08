"use client"

import { MainLayout } from "@/components/home/main-layout"
import { ProductImage } from "@/components/products/product-image"
import { ProductDetails } from "@/components/products/product-details"
import { ProductReviews } from "@/components/products/product-reviews"
import { products } from "@/lib/data"

export default function LogitechGProPage() {
  const product = {
    id: "logitech-g-pro-superlight",
    name: "Logitech G PRO Superlight",
    category: "gaming-mice",
    description: "Professional-grade wireless gaming mouse designed in collaboration with esports pros. Features LIGHTSPEED wireless technology and HERO 25K sensor.",
    imageUrl: "https://source.unsplash.com/random/400x400?gaming-mouse",
    votes: 1250,
    rank: 1,
    price: 149.99,
    specs: {
      sensor: "HERO 25K",
      dpi: "100-25,600",
      buttons: "5 programmable",
      weight: "63g",
      battery: "Up to 70 hours",
      connection: "LIGHTSPEED Wireless"
    }
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{product.name}</h1>
      
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <ProductImage product={product} />
          <div className="mt-4 flex items-center justify-center gap-4">
            <button className="vote-button">
              <span className="sr-only">Downvote</span>
              👎
            </button>
            <button className="vote-button active">
              <span className="sr-only">Upvote</span>
              👍
            </button>
          </div>
        </div>

        <div>
          <div className="mb-6">
            <h2 className="mb-2 text-lg font-semibold">Description</h2>
            <p className="text-muted-foreground">{product.description}</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Overall Rating:</span>
              <div className="flex">
                {"★★★★☆".split("").map((star, i) => (
                  <span key={i} className="text-primary">
                    {star}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <ProductDetails product={product} />
        </div>
      </div>

      <div className="mt-12">
        <ProductReviews productId={product.id} />
      </div>
    </div>
  )
}