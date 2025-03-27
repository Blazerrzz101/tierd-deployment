"use client"

import { useEffect, useState } from 'react'
import { Product, createProductUrl, getValidProductSlug, isValidProductSlug } from '@/utils/product-utils'
import { getEnhancedProductImage } from '@/utils/enhanced-images'
import { getProductAffiliateLinkAndImage } from '@/utils/affiliate-utils'
import { categories } from '@/lib/data'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowUpDown, CheckCircle, ExternalLink, XCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function TestProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<{
    categoryErrors: string[];
    slugErrors: string[];
    imageErrors: string[];
    productErrors: string[];
  }>({
    categoryErrors: [],
    slugErrors: [],
    imageErrors: [],
    productErrors: []
  })
  const [productsByCategory, setProductsByCategory] = useState<Record<string, Product[]>>({})
  const [orphanedProducts, setOrphanedProducts] = useState<Product[]>([])

  // Fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/products')
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }
        
        const data = await response.json()
        if (!data.success) {
          throw new Error(data.error || 'Failed to load products')
        }
        
        setProducts(data.products || [])
        
        // Group products by category
        const productGroups: Record<string, Product[]> = {}
        const categoryIds = categories.map(c => c.id)
        const orphans: Product[] = []
        
        // Group products and find orphans
        data.products.forEach((product: Product) => {
          if (product.category && categoryIds.includes(product.category)) {
            if (!productGroups[product.category]) {
              productGroups[product.category] = []
            }
            productGroups[product.category].push(product)
          } else {
            orphans.push(product)
          }
        })
        
        setProductsByCategory(productGroups)
        setOrphanedProducts(orphans)
        
        // Check for errors
        const errors = {
          categoryErrors: [] as string[],
          slugErrors: [] as string[],
          imageErrors: [] as string[],
          productErrors: [] as string[]
        }
        
        // Check for category errors
        data.products.forEach((product: Product) => {
          if (!product.category) {
            errors.categoryErrors.push(`Product "${product.name}" has no category`)
          } else if (!categoryIds.includes(product.category)) {
            errors.categoryErrors.push(`Product "${product.name}" has invalid category: ${product.category}`)
          }
        })
        
        // Check for slug errors
        data.products.forEach((product: Product) => {
          if (!product.url_slug) {
            errors.slugErrors.push(`Product "${product.name}" has no URL slug`)
          } else if (!isValidProductSlug(product.url_slug)) {
            errors.slugErrors.push(`Product "${product.name}" has invalid URL slug: ${product.url_slug}`)
          }
        })
        
        // Check for duplicate slugs
        const slugMap: Record<string, string[]> = {}
        data.products.forEach((product: Product) => {
          const slug = product.url_slug
          if (slug) {
            if (!slugMap[slug]) {
              slugMap[slug] = []
            }
            slugMap[slug].push(product.name)
          }
        })
        
        Object.entries(slugMap).forEach(([slug, productNames]) => {
          if (productNames.length > 1) {
            errors.slugErrors.push(`Duplicate URL slug "${slug}" used by: ${productNames.join(', ')}`)
          }
        })
        
        // Check for image errors
        data.products.forEach((product: Product) => {
          if (!product.image_url && !product.imageUrl) {
            errors.imageErrors.push(`Product "${product.name}" has no image URL`)
          }
        })
        
        // Check for missing required fields
        data.products.forEach((product: Product) => {
          const missingFields = []
          if (!product.id) missingFields.push('id')
          if (!product.name) missingFields.push('name')
          if (!product.description) missingFields.push('description')
          
          if (missingFields.length > 0) {
            errors.productErrors.push(`Product ${product.name || product.id || 'Unknown'} is missing required fields: ${missingFields.join(', ')}`)
          }
        })
        
        setErrors(errors)
        
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [])

  // Verify a product URL by checking it
  const verifyProductUrl = async (product: Product) => {
    try {
      const slug = product.url_slug || getValidProductSlug(product)
      const url = `/api/products?slug=${slug}`
      
      const response = await fetch(url)
      if (!response.ok) {
        return { success: false, error: `HTTP error ${response.status}` }
      }
      
      const data = await response.json()
      return { 
        success: data.success && data.product, 
        error: data.error || (data.success ? '' : 'Unknown error') 
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
  
  // Diagnostic test for a specific product
  const testProduct = async (product: Product) => {
    const enhancedImage = getEnhancedProductImage(product.name)
    const { affiliateLink } = getProductAffiliateLinkAndImage(product.name)
    const urlValid = await verifyProductUrl(product)
    
    return {
      hasEnhancedImage: !!enhancedImage,
      hasAffiliateLink: !!affiliateLink,
      urlValid
    }
  }

  if (loading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">Product Diagnostics</h1>
        <p className="mb-8 text-muted-foreground">Loading products...</p>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-4">Product Diagnostics</h1>
      <p className="mb-8 text-muted-foreground">
        This page diagnoses all products to find issues with URLs, categories, and data integrity.
      </p>
      
      {/* Summary Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Overview of product catalog health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{products.length}</div>
              <div className="text-sm text-muted-foreground">Total Products</div>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{categories.length}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-500">{
                errors.categoryErrors.length + 
                errors.slugErrors.length + 
                errors.imageErrors.length + 
                errors.productErrors.length
              }</div>
              <div className="text-sm text-muted-foreground">Total Issues</div>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-yellow-500">{orphanedProducts.length}</div>
              <div className="text-sm text-muted-foreground">Orphaned Products</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Errors Section */}
      {(errors.categoryErrors.length > 0 || 
        errors.slugErrors.length > 0 || 
        errors.imageErrors.length > 0 || 
        errors.productErrors.length > 0) && (
        <div className="mb-8 space-y-4">
          <h2 className="text-xl font-bold">Errors Found</h2>
          
          {errors.categoryErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Category Errors ({errors.categoryErrors.length})</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  {errors.categoryErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {errors.slugErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>URL Slug Errors ({errors.slugErrors.length})</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  {errors.slugErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {errors.imageErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Image Errors ({errors.imageErrors.length})</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  {errors.imageErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {errors.productErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Product Data Errors ({errors.productErrors.length})</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  {errors.productErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
      
      {/* Categories and Products */}
      <Tabs defaultValue="categories">
        <TabsList className="mb-4">
          <TabsTrigger value="categories">By Category</TabsTrigger>
          <TabsTrigger value="all">All Products</TabsTrigger>
          <TabsTrigger value="orphaned">Orphaned Products</TabsTrigger>
        </TabsList>
        
        {/* Categories Tab */}
        <TabsContent value="categories">
          <div className="grid gap-6">
            {categories.map(category => (
              <Card key={category.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{category.name}</CardTitle>
                    <Badge variant="outline">
                      {productsByCategory[category.id]?.length || 0} Products
                    </Badge>
                  </div>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {!productsByCategory[category.id] || productsByCategory[category.id].length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No products in this category
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>URL Slug</TableHead>
                            <TableHead>Enhanced Image</TableHead>
                            <TableHead>Affiliate Link</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {productsByCategory[category.id]?.map(product => {
                            const enhancedImage = getEnhancedProductImage(product.name);
                            const { affiliateLink } = getProductAffiliateLinkAndImage(product.name);
                            
                            return (
                              <TableRow key={product.id}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>
                                  {product.url_slug ? (
                                    <span className="font-mono text-xs bg-muted p-1 rounded">
                                      {product.url_slug}
                                    </span>
                                  ) : (
                                    <Badge variant="destructive">Missing</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {enhancedImage ? (
                                    <div className="flex items-center">
                                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                      <span className="text-green-500">Found</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center">
                                      <XCircle className="h-4 w-4 text-red-500 mr-1" />
                                      <span className="text-red-500">Not found</span>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {affiliateLink ? (
                                    <div className="flex items-center">
                                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                      <span className="text-green-500">Found</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center">
                                      <XCircle className="h-4 w-4 text-red-500 mr-1" />
                                      <span className="text-red-500">Not found</span>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="sm" asChild>
                                      <Link href={createProductUrl(product)}>
                                        View
                                        <ExternalLink className="h-3 w-3 ml-1" />
                                      </Link>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* All Products Tab */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Products ({products.length})</CardTitle>
              <CardDescription>Complete list of all products in the database</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>URL Slug</TableHead>
                      <TableHead>Enhanced Image</TableHead>
                      <TableHead>Affiliate Link</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map(product => {
                      const enhancedImage = getEnhancedProductImage(product.name);
                      const { affiliateLink } = getProductAffiliateLinkAndImage(product.name);
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>
                            {product.category ? (
                              <Badge variant="outline" className="capitalize">
                                {product.category.replace('-', ' ')}
                              </Badge>
                            ) : (
                              <Badge variant="destructive">Missing</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {product.url_slug ? (
                              <span className="font-mono text-xs bg-muted p-1 rounded">
                                {product.url_slug}
                              </span>
                            ) : (
                              <Badge variant="destructive">Missing</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {enhancedImage ? (
                              <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                <span className="text-green-500">Found</span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <XCircle className="h-4 w-4 text-red-500 mr-1" />
                                <span className="text-red-500">Not found</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {affiliateLink ? (
                              <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                <span className="text-green-500">Found</span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <XCircle className="h-4 w-4 text-red-500 mr-1" />
                                <span className="text-red-500">Not found</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={createProductUrl(product)}>
                                  View
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Orphaned Products Tab */}
        <TabsContent value="orphaned">
          <Card>
            <CardHeader>
              <CardTitle>Orphaned Products ({orphanedProducts.length})</CardTitle>
              <CardDescription>Products without a valid category</CardDescription>
            </CardHeader>
            <CardContent>
              {orphanedProducts.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No orphaned products found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Assigned Category</TableHead>
                        <TableHead>URL Slug</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orphanedProducts.map(product => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>
                            {product.category ? (
                              <Badge variant="destructive" className="capitalize">
                                {product.category.replace('-', ' ')} (Invalid)
                              </Badge>
                            ) : (
                              <Badge variant="destructive">Missing</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {product.url_slug ? (
                              <span className="font-mono text-xs bg-muted p-1 rounded">
                                {product.url_slug}
                              </span>
                            ) : (
                              <Badge variant="destructive">Missing</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={createProductUrl(product)}>
                                  View
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 