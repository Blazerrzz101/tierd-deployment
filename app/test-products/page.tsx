"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ProductLink } from "@/components/products/product-link"
import { getClientId } from "@/utils/client-id"
import { mockProducts } from "@/app/api/products/route"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, ExternalLink, AlertTriangle, CheckCircle } from "lucide-react"

export default function TestProductsPage() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])
  const [testResults, setTestResults] = useState<Record<string, { valid: boolean, error?: string }>>({})
  const [clientId, setClientId] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  
  useEffect(() => {
    // Get client ID for testing
    setClientId(getClientId())
    
    // First load products from mockProducts
    const initialProducts = [...mockProducts]
    
    // Then try to fetch from API
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/products')
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && Array.isArray(data.products)) {
            setProducts(data.products)
          } else {
            // Use mock products as fallback
            setProducts(initialProducts)
          }
        } else {
          setProducts(initialProducts)
        }
      } catch (error) {
        console.error('Error loading products:', error)
        setProducts(initialProducts)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [])
  
  // Test a product by fetching it
  const testProduct = async (product: any) => {
    try {
      const slug = product.url_slug
      if (!slug) {
        setTestResults(prev => ({
          ...prev,
          [product.id]: { valid: false, error: "No URL slug defined" }
        }))
        return
      }
      
      const response = await fetch(`/api/products/product?slug=${slug}&clientId=${clientId}`)
      const data = await response.json()
      
      if (response.ok && data.success) {
        setTestResults(prev => ({
          ...prev,
          [product.id]: { valid: true }
        }))
      } else {
        setTestResults(prev => ({
          ...prev,
          [product.id]: { valid: false, error: data.error || `HTTP ${response.status}` }
        }))
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [product.id]: { 
          valid: false, 
          error: error instanceof Error ? error.message : "Unknown error" 
        }
      }))
    }
  }
  
  // Filter products by search term
  const filteredProducts = products.filter(product => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      product.name?.toLowerCase().includes(searchLower) ||
      product.category?.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower) ||
      product.url_slug?.toLowerCase().includes(searchLower) ||
      product.id?.toLowerCase().includes(searchLower)
    )
  })
  
  // Group products by category
  const productsByCategory: Record<string, any[]> = {}
  
  filteredProducts.forEach(product => {
    const category = product.category || 'uncategorized'
    if (!productsByCategory[category]) {
      productsByCategory[category] = []
    }
    productsByCategory[category].push(product)
  })
  
  // Sort categories by name
  const categories = Object.keys(productsByCategory).sort()
  
  return (
    <div className="container py-10">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Test Products Page</h1>
          <p className="text-muted-foreground mb-4">
            Use this page to test all available products and diagnose issues with product pages.
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/products">
                <ExternalLink className="h-4 w-4 mr-2" />
                Products Page
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="sm">
              <Link href="/vote-status">
                <ExternalLink className="h-4 w-4 mr-2" />
                Vote Status
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-4 mb-6 items-center">
            <div className="flex-1">
              <Input
                placeholder="Search products..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading products...
                </span>
              ) : (
                <span>
                  Found {filteredProducts.length} products in {categories.length} categories
                </span>
              )}
            </div>
          </div>
        </div>
        
        <Tabs defaultValue={categories[0] || "all"}>
          <TabsList className="mb-4 flex flex-wrap h-auto">
            <TabsTrigger value="all">All ({filteredProducts.length})</TabsTrigger>
            {categories.map(category => (
              <TabsTrigger key={category} value={category}>
                {category.replace('-', ' ')} ({productsByCategory[category].length})
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all">
            <ProductGrid 
              products={filteredProducts} 
              testResults={testResults} 
              onTest={testProduct} 
            />
          </TabsContent>
          
          {categories.map(category => (
            <TabsContent key={category} value={category}>
              <ProductGrid 
                products={productsByCategory[category]} 
                testResults={testResults} 
                onTest={testProduct} 
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}

function ProductGrid({ 
  products, 
  testResults, 
  onTest 
}: { 
  products: any[], 
  testResults: Record<string, { valid: boolean, error?: string }>,
  onTest: (product: any) => void
}) {
  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No products found.
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map(product => (
        <Card key={product.id} className="flex flex-col h-full">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="inline-flex items-center gap-2">
                  {product.name}
                  {testResults[product.id] && (
                    <>
                      {testResults[product.id].valid ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                    </>
                  )}
                </CardTitle>
                <CardDescription>{product.category}</CardDescription>
              </div>
              <Badge variant={product.url_slug ? "outline" : "destructive"} className="text-xs">
                {product.url_slug ? "Has slug" : "No slug"}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1">
            <div className="text-xs space-y-2">
              <div>
                <span className="font-semibold">ID:</span> {product.id}
              </div>
              <div>
                <span className="font-semibold">Slug:</span> {product.url_slug || "(not set)"}
              </div>
              <div>
                <span className="font-semibold">Price:</span> ${typeof product.price === 'number' ? product.price.toFixed(2) : 'N/A'}
              </div>
              <div className="line-clamp-2">
                <span className="font-semibold">Description:</span> {product.description || "No description"}
              </div>
              
              {testResults[product.id] && !testResults[product.id].valid && testResults[product.id].error && (
                <div className="mt-4 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800">
                  <p className="font-semibold">Error:</p>
                  <p>{testResults[product.id].error}</p>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="border-t flex flex-wrap gap-2 pt-4">
            <ProductLink
              productId={product.id}
              productSlug={product.url_slug}
              className="flex-1"
            >
              <Button variant="default" className="w-full">
                View Product
              </Button>
            </ProductLink>
            
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onTest(product)}
            >
              Test
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
} 