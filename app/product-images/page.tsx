"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Product } from "@/types/product"
import { batchEnrichProductsWithRealImages, enrichProductWithRealImages } from "@/utils/product-image-finder"
import { Loader2, Search, Image as ImageIcon, RefreshCw, Check, X } from "lucide-react"
import { createProductUrl } from "@/utils/product-utils"

export default function ProductImagesPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [enrichedProducts, setEnrichedProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEnriching, setIsEnriching] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  // Fetch products on component mount
  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/products')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.products) {
            setProducts(data.products)
          }
        }
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProducts()
  }, [])
  
  // Filter products based on category and search query
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    const matchesSearch = searchQuery === "" || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesCategory && matchesSearch
  })
  
  // Get unique categories from products
  const categories = Array.from(new Set(products.map(product => product.category)))
  
  // Enrich all products with real images
  const handleEnrichAllProducts = async () => {
    if (filteredProducts.length === 0) return
    
    setIsEnriching(true)
    
    try {
      const enriched = await batchEnrichProductsWithRealImages(filteredProducts)
      setEnrichedProducts(enriched)
    } catch (error) {
      console.error("Error enriching products:", error)
    } finally {
      setIsEnriching(false)
    }
  }
  
  // Enrich a single product with real images
  const handleEnrichProduct = async (product: Product) => {
    setSelectedProduct(product)
    
    try {
      const enriched = await enrichProductWithRealImages(product)
      
      // Update the enriched products list
      setEnrichedProducts(prev => {
        const newEnriched = [...prev]
        const index = newEnriched.findIndex(p => p.id === enriched.id)
        
        if (index >= 0) {
          newEnriched[index] = enriched
        } else {
          newEnriched.push(enriched)
        }
        
        return newEnriched
      })
      
      setSelectedProduct(enriched)
    } catch (error) {
      console.error("Error enriching product:", error)
    }
  }
  
  // Get enriched version of a product if available
  const getEnrichedProduct = (productId: string) => {
    return enrichedProducts.find(p => p.id === productId)
  }
  
  // Check if a product has been enriched
  const isProductEnriched = (productId: string) => {
    return enrichedProducts.some(p => p.id === productId)
  }
  
  return (
    <div className="container max-w-7xl mx-auto py-8">
      <div className="flex flex-col space-y-4 mb-8">
        <h1 className="text-3xl font-bold">Product Image Finder</h1>
        <p className="text-muted-foreground">
          Find and preview real product images from the web
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Product List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Products</CardTitle>
              <CardDescription>
                {isLoading ? "Loading products..." : `${filteredProducts.length} products available`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filter Controls */}
              <div className="flex flex-col space-y-2">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category.replace(/-/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    disabled={isLoading || isEnriching || filteredProducts.length === 0}
                    onClick={handleEnrichAllProducts}
                  >
                    {isEnriching ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Enrich All
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search products..."
                    className="pl-8 w-full px-3 py-2 border rounded-md"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              {/* Product List */}
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No products found matching your criteria
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-2">
                    {filteredProducts.map(product => {
                      const enriched = getEnrichedProduct(product.id);
                      const isEnriched = !!enriched;
                      
                      return (
                        <div
                          key={product.id}
                          className={`p-3 rounded-md border cursor-pointer transition-colors ${
                            selectedProduct?.id === product.id
                              ? "bg-primary/10 border-primary/30"
                              : "hover:bg-muted"
                          }`}
                          onClick={() => setSelectedProduct(isEnriched ? enriched : product)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{product.name}</p>
                              <p className="text-sm text-muted-foreground capitalize">
                                {product.category.replace(/-/g, ' ')}
                              </p>
                            </div>
                            <div className="flex-shrink-0 ml-2">
                              {isEnriched ? (
                                <Badge variant="success" className="ml-2">
                                  <Check className="h-3 w-3 mr-1" />
                                  Enriched
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEnrichProduct(product);
                                  }}
                                >
                                  <ImageIcon className="h-3.5 w-3.5 mr-1" />
                                  Find
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Product Preview */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="h-full flex flex-col">
            {selectedProduct ? (
              <>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{selectedProduct.name}</CardTitle>
                      <CardDescription>
                        {selectedProduct.category.replace(/-/g, ' ')}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEnrichProduct(selectedProduct)}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh Images
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(createProductUrl(selectedProduct))}
                      >
                        View Product
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1">
                  <Tabs defaultValue="images" className="h-full flex flex-col">
                    <TabsList>
                      <TabsTrigger value="images">Images</TabsTrigger>
                      <TabsTrigger value="info">Product Info</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="images" className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                        {/* Main Image */}
                        <div className="h-80 md:h-auto relative border rounded-md overflow-hidden bg-muted">
                          <Image
                            src={selectedProduct.imageUrl || selectedProduct.image_url || '/images/product-placeholder.png'}
                            alt={selectedProduct.name}
                            fill
                            className="object-contain p-4"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                          
                          {/* Image Source Badge */}
                          {(selectedProduct as any).imageSource && (
                            <Badge className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/60">
                              Source: {(selectedProduct as any).imageSource}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Alternate Images */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Alternate Images</h3>
                          
                          {(selectedProduct as any).alternateImages?.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                              {(selectedProduct as any).alternateImages.map((imgUrl: string, index: number) => (
                                <div key={index} className="aspect-[4/3] relative border rounded-md overflow-hidden bg-muted">
                                  <Image
                                    src={imgUrl}
                                    alt={`${selectedProduct.name} - Alternate ${index + 1}`}
                                    fill
                                    className="object-contain p-2"
                                    sizes="(max-width: 768px) 50vw, 25vw"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-40 flex items-center justify-center border rounded-md bg-muted/50">
                              <p className="text-muted-foreground">No alternate images available</p>
                            </div>
                          )}
                          
                          <div className="pt-4">
                            <h3 className="text-lg font-medium mb-2">Image Analysis</h3>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Using original image:</span>
                                <Badge variant={
                                  selectedProduct.imageUrl && 
                                  !selectedProduct.imageUrl.includes("unsplash.com/random") && 
                                  !selectedProduct.imageUrl.includes("placeholder")
                                    ? "success" 
                                    : "destructive"
                                }>
                                  {selectedProduct.imageUrl && 
                                   !selectedProduct.imageUrl.includes("unsplash.com/random") && 
                                   !selectedProduct.imageUrl.includes("placeholder")
                                    ? <Check className="h-3 w-3 mr-1" />
                                    : <X className="h-3 w-3 mr-1" />
                                  }
                                  {selectedProduct.imageUrl && 
                                   !selectedProduct.imageUrl.includes("unsplash.com/random") && 
                                   !selectedProduct.imageUrl.includes("placeholder")
                                    ? "Yes" 
                                    : "No"
                                  }
                                </Badge>
                              </div>
                              
                              <div className="flex justify-between">
                                <span>Has been enriched:</span>
                                <Badge variant={isProductEnriched(selectedProduct.id) ? "success" : "outline"}>
                                  {isProductEnriched(selectedProduct.id) 
                                    ? <Check className="h-3 w-3 mr-1" /> 
                                    : <X className="h-3 w-3 mr-1" />
                                  }
                                  {isProductEnriched(selectedProduct.id) ? "Yes" : "No"}
                                </Badge>
                              </div>
                              
                              <div className="flex justify-between">
                                <span>Has alternate images:</span>
                                <Badge variant={(selectedProduct as any).alternateImages?.length > 0 ? "success" : "outline"}>
                                  {(selectedProduct as any).alternateImages?.length > 0 
                                    ? <Check className="h-3 w-3 mr-1" /> 
                                    : <X className="h-3 w-3 mr-1" />
                                  }
                                  {(selectedProduct as any).alternateImages?.length > 0 
                                    ? "Yes" 
                                    : "No"
                                  }
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="info" className="flex-1">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium mb-2">Description</h3>
                          <p className="text-muted-foreground">{selectedProduct.description}</p>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="text-lg font-medium mb-2">Details</h3>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col space-y-1">
                              <span className="text-sm text-muted-foreground">Price</span>
                              <span>{selectedProduct.price ? `$${selectedProduct.price.toFixed(2)}` : 'N/A'}</span>
                            </div>
                            <div className="flex flex-col space-y-1">
                              <span className="text-sm text-muted-foreground">Rating</span>
                              <span>{selectedProduct.rating ? `${selectedProduct.rating.toFixed(1)}/5.0` : 'N/A'}</span>
                            </div>
                            <div className="flex flex-col space-y-1">
                              <span className="text-sm text-muted-foreground">Reviews</span>
                              <span>{selectedProduct.review_count || 0}</span>
                            </div>
                            <div className="flex flex-col space-y-1">
                              <span className="text-sm text-muted-foreground">Rank</span>
                              <span>#{selectedProduct.rank || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="text-lg font-medium mb-2">Specifications</h3>
                          {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                              {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                                <div key={key} className="flex flex-col space-y-1">
                                  <span className="text-sm text-muted-foreground capitalize">{key}</span>
                                  <span>{value}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground">No specifications available</p>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                
                <CardFooter className="border-t pt-4">
                  <div className="w-full flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => router.push('/product-image-test')}
                    >
                      View All Product Images
                    </Button>
                    
                    <Button
                      onClick={() => router.push(createProductUrl(selectedProduct))}
                    >
                      Go to Product Page
                    </Button>
                  </div>
                </CardFooter>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <ImageIcon className="h-16 w-16 mb-4 text-muted-foreground/40" />
                <h3 className="text-xl font-medium">No Product Selected</h3>
                <p className="text-muted-foreground text-center mt-2">
                  Select a product from the list to view and find real images
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
} 