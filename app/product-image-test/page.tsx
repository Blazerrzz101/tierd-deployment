"use client"

import { useState, useEffect } from 'react'
import { Product } from '@/types/product'
import { getEnhancedProductImage, getImageAttribution, getAlternateProductImages, getProductsWithEnhancedImages } from '@/utils/enhanced-images'
import { getProductAffiliateLinkAndImage, createAmazonAffiliateLink } from '@/utils/affiliate-utils'
import { createProductUrl } from '@/utils/product-utils'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, X, AlertTriangle, ExternalLink, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ProductImageTest() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [productResults, setProductResults] = useState<Record<string, {
    hasImage: boolean,
    hasAffiliate: boolean,
    hasAlternateImages: boolean,
    alternateImageCount: number,
    url: string,
    imageUrl: string,
    affiliateUrl: string | undefined,
    attribution: string | undefined
  }>>({})
  const [activeTab, setActiveTab] = useState<string>("all")

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/products?limit=100')
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }
        
        const data = await response.json()
        if (!data.success) {
          throw new Error(data.error || 'Failed to load products')
        }
        
        setProducts(data.products || [])
        
        // Test images and affiliate links for each product
        const results: Record<string, any> = {}
        
        data.products.forEach((product: Product) => {
          const enhancedImage = getEnhancedProductImage(product.name)
          const { affiliateLink } = getProductAffiliateLinkAndImage(product.name)
          const attribution = getImageAttribution(product.name)
          const alternateImages = getAlternateProductImages(product.name)
          
          results[product.id] = {
            hasImage: !!enhancedImage,
            hasAffiliate: !!affiliateLink,
            hasAlternateImages: alternateImages.length > 0,
            alternateImageCount: alternateImages.length,
            url: createProductUrl(product),
            imageUrl: enhancedImage || product.imageUrl || product.image_url || '/images/product-placeholder.png',
            affiliateUrl: affiliateLink,
            attribution: attribution
          }
        })
        
        setProductResults(results)
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [])

  if (loading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">Product Image Test</h1>
        <p className="mb-8 text-muted-foreground">Loading products...</p>
      </div>
    )
  }

  // Group products by category
  const productsByCategory: Record<string, Product[]> = {}
  products.forEach(product => {
    if (!product.category) return
    
    if (!productsByCategory[product.category]) {
      productsByCategory[product.category] = []
    }
    
    productsByCategory[product.category].push(product)
  })

  // Count products with images and affiliate links
  const totalProducts = products.length
  const productsWithImages = Object.values(productResults).filter(r => r.hasImage).length
  const productsWithAffiliates = Object.values(productResults).filter(r => r.hasAffiliate).length
  const productsWithAlternateImages = Object.values(productResults).filter(r => r.hasAlternateImages).length
  
  // Get all products with enhanced images
  const productsWithEnhancedImages = getProductsWithEnhancedImages()

  // Filter products for the selected tab
  const filteredCategories = activeTab === "all" 
    ? Object.keys(productsByCategory) 
    : [activeTab]

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-4">Product Image Test</h1>
      <p className="mb-4 text-muted-foreground">
        This page tests all products to ensure they have proper enhanced images and affiliate links.
      </p>
      
      {/* Tabs for category filtering */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Categories</TabsTrigger>
          {Object.keys(productsByCategory).map(category => (
            <TabsTrigger key={category} value={category}>
              {category.replace(/-/g, ' ')}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalProducts}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Enhanced Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <p className="text-4xl font-bold">{productsWithImages}</p>
              <Badge variant={productsWithImages === totalProducts ? "success" : "destructive"}>
                {Math.round((productsWithImages / totalProducts) * 100)}%
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Products with Alternate Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <p className="text-4xl font-bold">{productsWithAlternateImages}</p>
              <Badge variant={productsWithAlternateImages === totalProducts ? "success" : "destructive"}>
                {Math.round((productsWithAlternateImages / totalProducts) * 100)}%
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Affiliate Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <p className="text-4xl font-bold">{productsWithAffiliates}</p>
              <Badge variant={productsWithAffiliates === totalProducts ? "success" : "destructive"}>
                {Math.round((productsWithAffiliates / totalProducts) * 100)}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Missing Products Section */}
      <div className="mb-10 p-4 border rounded-lg bg-muted/20">
        <h2 className="text-xl font-semibold mb-2">Products in Database but Missing Enhanced Images</h2>
        <p className="text-sm text-muted-foreground mb-4">
          These products exist in our application but don't have corresponding enhanced images
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {products
            .filter(p => !getEnhancedProductImage(p.name))
            .map(product => (
              <div key={product.id} className="text-sm p-2 border rounded flex items-center justify-between">
                <span className="font-medium">{product.name}</span>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
            ))}
        </div>
      </div>
      
      {/* Products by Category */}
      <div className="space-y-10">
        {filteredCategories.map(category => (
          <div key={category} className="border-t pt-8">
            <h2 className="text-2xl font-bold mb-4 capitalize">{category.replace(/-/g, ' ')}</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {productsByCategory[category].map(product => {
                const result = productResults[product.id]
                if (!result) return null
                
                return (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="aspect-square relative bg-muted">
                      <Image 
                        src={result.imageUrl}
                        alt={product.name}
                        fill
                        className="object-contain p-4"
                      />
                      
                      {result.attribution && (
                        <Badge variant="secondary" className="absolute bottom-2 right-2 opacity-80">
                          {result.attribution}
                        </Badge>
                      )}
                      
                      {result.hasAlternateImages && (
                        <Badge variant="secondary" className="absolute bottom-2 left-2 opacity-80">
                          +{result.alternateImageCount} more
                        </Badge>
                      )}
                    </div>
                    
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base line-clamp-2">{product.name}</CardTitle>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Enhanced Image</span>
                          {result.hasImage ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span>Alternate Images</span>
                          {result.hasAlternateImages ? (
                            <div className="flex items-center">
                              <span className="text-xs mr-1">{result.alternateImageCount}</span>
                              <Check className="h-4 w-4 text-green-500" />
                            </div>
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span>Affiliate Link</span>
                          {result.hasAffiliate ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 mt-4">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={result.url}>
                            <ImageIcon className="h-3.5 w-3.5 mr-1" />
                            View Product
                          </Link>
                        </Button>
                        
                        {result.affiliateUrl && (
                          <Button 
                            size="sm" 
                            className="bg-[#FF9900] hover:bg-[#FF9900]/90 text-white"
                            asChild
                          >
                            <a href={result.affiliateUrl} target="_blank" rel="noopener noreferrer">
                              Shop on Amazon
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
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