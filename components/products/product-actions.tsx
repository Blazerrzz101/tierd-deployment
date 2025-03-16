"use client"

import { Button } from "@/components/ui/button"
import { ShoppingCart, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface ProductActionsProps {
  productId: string
  amazonUrl: string
  productName: string
}

export function ProductActions({ productId, amazonUrl, productName }: ProductActionsProps) {
  const handleBuyNow = () => {
    // Track the click event
    try {
      fetch('/api/track-purchase-click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          destination: 'amazon'
        })
      })
    } catch (error) {
      console.error('Failed to track purchase click:', error)
    }

    // Open Amazon in a new tab
    window.open(amazonUrl, '_blank')
  }

  return (
    <div className="flex items-center gap-4">
      <Button
        onClick={handleBuyNow}
        size="lg"
        className="group relative flex items-center gap-2 bg-gradient-to-r from-[#FF9900] to-[#FFB700] text-black hover:from-[#FFB700] hover:to-[#FFC700]"
      >
        <ShoppingCart className="h-5 w-5" />
        Buy on Amazon
        <ExternalLink className="h-4 w-4 opacity-50 transition-opacity group-hover:opacity-100" />
      </Button>
      
      <div className="text-sm text-muted-foreground">
        *Price and availability on Amazon
      </div>
    </div>
  )
} 