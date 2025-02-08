"use client"

import { useProductStats } from "@/lib/hooks/use-product-stats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, ThumbsUp, ThumbsDown } from "lucide-react"

interface ProductStatsDisplayProps {
  productId: string
  userId: string
}

export function ProductStatsDisplay({ productId, userId }: ProductStatsDisplayProps) {
  const stats = useProductStats(productId, userId)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Product Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-sm font-medium">Upvotes</p>
              <p className="text-2xl font-bold">{stats.upvotes}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThumbsDown className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-sm font-medium">Downvotes</p>
              <p className="text-2xl font-bold">{stats.downvotes}</p>
            </div>
          </div>

          <div className="col-span-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">Active Users</p>
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}