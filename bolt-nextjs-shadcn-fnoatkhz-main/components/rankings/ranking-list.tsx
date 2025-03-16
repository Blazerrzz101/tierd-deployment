"use client"

import { RankingCard } from "./ranking-card"
import { products } from "@/lib/data"

interface RankingListProps {
  categoryId: string
}

export function RankingList({ categoryId }: RankingListProps) {
  // Get top 5 products for the selected category
  const topProducts = products
    .filter(product => product.category === categoryId)
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 5)

  return (
    <div className="mt-8 space-y-4">
      {topProducts.map((product, index) => (
        <RankingCard
          key={product.id}
          rank={index + 1}
          product={product}
        />
      ))}
    </div>
  )
}