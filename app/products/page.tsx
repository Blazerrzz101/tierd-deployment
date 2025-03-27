"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { mockProducts, getValidProductSlug } from "@/utils/product-utils"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronRight, ExternalLink } from "lucide-react"

export default function ProductsPage() {
  const router = useRouter()
  
  // Products by category for easy browsing
  const productsByCategory = mockProducts.reduce((acc, product) => {
    const category = product.category || "uncategorized"
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(product)
    return acc
  }, {} as Record<string, typeof mockProducts>)
  
  // Sort categories by number of products
  const sortedCategories = Object.keys(productsByCategory).sort((a, b) => 
    productsByCategory[b].length - productsByCategory[a].length
  )
  
  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Browse All Products</h1>
      
      <div className="space-y-16">
        {sortedCategories.map(category => (
          <div key={category} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold capitalize">{category.replace(/-/g, ' ')}</h2>
              <Link href={`/rankings?category=${category}`}>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  View Rankings
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productsByCategory[category].map(product => {
                const productUrl = `/products/${getValidProductSlug(product)}`
                
                return (
                  <Card key={product.id} className="hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                      <CardTitle className="line-clamp-1">
                        <Link href={productUrl} className="hover:text-primary flex items-center gap-2">
                          {product.name}
                          <ExternalLink className="h-4 w-4 opacity-50" />
                        </Link>
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {product.description}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Link href={productUrl}>
                        <Button>View Details</Button>
                      </Link>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 