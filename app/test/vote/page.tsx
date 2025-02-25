"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { VoteButtons } from '@/components/products/vote-buttons'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function VoteTestPage() {
  const { toast } = useToast()
  const [productId, setProductId] = useState<string>('')
  const [clientId, setClientId] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [testResults, setTestResults] = useState<any[]>([])
  const [productDetails, setProductDetails] = useState<any>(null)
  const [voteStatus, setVoteStatus] = useState<any>(null)
  const [fixResults, setFixResults] = useState<any>(null)
  const [allProductStatus, setAllProductStatus] = useState<any>(null)
  const [fixAllResults, setFixAllResults] = useState<any>(null)
  
  // Get client ID from localStorage on page load
  useEffect(() => {
    const storedClientId = localStorage.getItem('vote_client_id') || ''
    setClientId(storedClientId)
  }, [])
  
  // Fetch a sample product if no product ID is provided
  useEffect(() => {
    if (!productId) {
      fetchSampleProduct()
    }
  }, [])
  
  // Function to fetch a sample product
  const fetchSampleProduct = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/vote-debug?mode=data')
      const data = await response.json()
      
      if (data?.product?.id) {
        setProductId(data.product.id)
        setProductDetails(data.product)
        toast({
          title: 'Sample product loaded',
          description: `Loaded product: ${data.product.name}`,
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load sample product',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching sample product:', error)
      toast({
        title: 'Error',
        description: 'Failed to load sample product',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Check vote counts against actual votes in database
  const checkVoteCounts = async () => {
    if (!productId) {
      toast({
        title: 'Error',
        description: 'Please provide a product ID',
        variant: 'destructive',
      })
      return
    }
    
    try {
      setIsLoading(true)
      const response = await fetch(`/api/vote-fix?productId=${productId}`)
      const data = await response.json()
      
      setVoteStatus(data)
      
      if (data.analysis?.needsFixing) {
        toast({
          title: 'Vote count issue detected',
          description: 'The stored vote counts do not match the actual votes. Click "Fix Vote Counts" to repair.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Vote counts are correct',
          description: 'The stored vote counts match the actual votes in the database.',
        })
      }
      
      // Update product details with the latest data
      if (data.product) {
        setProductDetails(data.product)
      }
    } catch (error) {
      console.error('Error checking vote counts:', error)
      toast({
        title: 'Error',
        description: 'Failed to check vote counts',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Fix vote counts by calling our API
  const fixVoteCounts = async () => {
    if (!productId) {
      toast({
        title: 'Error',
        description: 'Please provide a product ID',
        variant: 'destructive',
      })
      return
    }
    
    try {
      setIsLoading(true)
      const response = await fetch('/api/vote-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      })
      
      const data = await response.json()
      setFixResults(data)
      
      if (data.success) {
        toast({
          title: 'Vote counts fixed',
          description: `Updated from ${data.before.upvotes}/${data.before.downvotes} to ${data.after.upvotes}/${data.after.downvotes}`,
        })
        
        // Update product details with the fixed counts
        setProductDetails({
          ...productDetails,
          upvotes: data.after.upvotes,
          downvotes: data.after.downvotes,
          score: data.after.score,
        })
        
        // Clear the vote status since we've fixed it
        setVoteStatus(null)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fix vote counts',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fixing vote counts:', error)
      toast({
        title: 'Error',
        description: 'Failed to fix vote counts',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Check status of all products
  const checkAllProducts = async () => {
    try {
      setIsLoading(true)
      setAllProductStatus(null)
      
      const response = await fetch('/api/vote-fix-all')
      const data = await response.json()
      
      setAllProductStatus(data)
      
      if (data.needFixing > 0) {
        toast({
          title: 'Products need fixing',
          description: `${data.needFixing} out of ${data.totalProducts} products have incorrect vote counts.`,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'All products are correct',
          description: `All ${data.totalProducts} products have correct vote counts.`,
        })
      }
    } catch (error) {
      console.error('Error checking all products:', error)
      toast({
        title: 'Error',
        description: 'Failed to check all products',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Fix vote counts for all products
  const fixAllProducts = async () => {
    try {
      setIsLoading(true)
      setFixAllResults(null)
      
      const response = await fetch('/api/vote-fix-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      setFixAllResults(data)
      
      if (data.success) {
        toast({
          title: 'All products processed',
          description: `Fixed ${data.fixedCount} products. ${data.noChangeCount} were already correct.`,
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fix all products',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fixing all products:', error)
      toast({
        title: 'Error',
        description: 'Failed to fix all products',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Run a vote test
  const runVoteTest = async () => {
    if (!productId) {
      toast({
        title: 'Error',
        description: 'Please provide a product ID',
        variant: 'destructive',
      })
      return
    }
    
    try {
      setIsLoading(true)
      setTestResults([])
      
      // Step 1: Check initial votes
      const initialResponse = await fetch(`/api/vote-test?productId=${productId}&clientId=${clientId}`)
      const initialData = await initialResponse.json()
      
      setTestResults(prev => [...prev, {
        step: 'Initial check',
        data: initialData,
        timestamp: new Date().toISOString(),
      }])
      
      // Step 2: Cast an upvote
      const voteResponse = await fetch('/api/vote-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          clientId,
          voteType: 1, // Upvote
        }),
      })
      
      const voteData = await voteResponse.json()
      
      setTestResults(prev => [...prev, {
        step: 'Cast upvote',
        data: voteData,
        timestamp: new Date().toISOString(),
      }])
      
      // Step 3: Check votes again
      const finalResponse = await fetch(`/api/vote-test?productId=${productId}&clientId=${clientId}`)
      const finalData = await finalResponse.json()
      
      setTestResults(prev => [...prev, {
        step: 'Final check',
        data: finalData,
        timestamp: new Date().toISOString(),
      }])
      
      // Update product details
      if (finalData.product) {
        setProductDetails(finalData.product)
      }
      
      toast({
        title: 'Vote test completed',
        description: `Ran ${testResults.length + 1} test steps`,
      })
    } catch (error) {
      console.error('Error running vote test:', error)
      toast({
        title: 'Error',
        description: 'Failed to run vote test',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Reset votes by downvoting twice (to cancel out any upvote and then remove the downvote)
  const resetVotes = async () => {
    if (!productId || !clientId) {
      toast({
        title: 'Error',
        description: 'Please provide product ID and client ID',
        variant: 'destructive',
      })
      return
    }
    
    try {
      setIsLoading(true)
      
      // First downvote to cancel any upvote
      await fetch('/api/vote-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          clientId,
          voteType: -1, // Downvote
        }),
      })
      
      // Second downvote to cancel the downvote (creates a null vote)
      await fetch('/api/vote-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          clientId,
          voteType: -1, // Downvote again to reset
        }),
      })
      
      // Get updated product info
      const response = await fetch(`/api/vote-test?productId=${productId}&clientId=${clientId}`)
      const data = await response.json()
      
      if (data.product) {
        setProductDetails(data.product)
      }
      
      toast({
        title: 'Votes reset',
        description: 'Your votes for this product have been reset',
      })
    } catch (error) {
      console.error('Error resetting votes:', error)
      toast({
        title: 'Error',
        description: 'Failed to reset votes',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Create a mock product object for the VoteButtons component
  const mockProduct = productDetails ? {
    id: productDetails.id,
    name: productDetails.name,
    upvotes: productDetails.upvotes,
    downvotes: productDetails.downvotes,
    score: productDetails.score,
  } : null

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Vote System Test Page</h1>
      
      <Tabs defaultValue="single">
        <TabsList className="mb-4">
          <TabsTrigger value="single">Single Product Test</TabsTrigger>
          <TabsTrigger value="all">All Products</TabsTrigger>
        </TabsList>
        
        <TabsContent value="single">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Configuration Card */}
            <Card>
              <CardHeader>
                <CardTitle>Test Configuration</CardTitle>
                <CardDescription>
                  Set up parameters for testing the vote system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="productId" className="text-sm font-medium">
                    Product ID
                  </label>
                  <Input
                    id="productId"
                    placeholder="Enter product ID"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="clientId" className="text-sm font-medium">
                    Client ID (for anonymous voting)
                  </label>
                  <Input
                    id="clientId"
                    placeholder="Client ID from localStorage"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    disabled
                  />
                  <p className="text-xs text-gray-500">
                    This is automatically retrieved from localStorage
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-4">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={fetchSampleProduct} disabled={isLoading}>
                    Fetch Sample Product
                  </Button>
                  <Button 
                    onClick={runVoteTest} 
                    disabled={isLoading || !productId}
                    variant="outline"
                  >
                    Run Vote Test
                  </Button>
                  <Button 
                    onClick={resetVotes} 
                    disabled={isLoading || !productId || !clientId}
                    variant="outline"
                  >
                    Reset My Votes
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button 
                    onClick={checkVoteCounts} 
                    disabled={isLoading || !productId}
                    variant="secondary"
                  >
                    Check Vote Counts
                  </Button>
                  <Button 
                    onClick={fixVoteCounts} 
                    disabled={isLoading || !productId || !voteStatus?.analysis?.needsFixing}
                    variant={voteStatus?.analysis?.needsFixing ? "destructive" : "secondary"}
                  >
                    Fix Vote Counts
                  </Button>
                </div>
              </CardFooter>
            </Card>

            {/* Current Product Info */}
            {productDetails && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                  <CardDescription>
                    Current data for selected product
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium">Name</h3>
                    <p>{productDetails.name}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium">ID</h3>
                    <p className="text-xs font-mono">{productDetails.id}</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium">Upvotes</h3>
                      <Badge variant="outline">{productDetails.upvotes}</Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium">Downvotes</h3>
                      <Badge variant="outline">{productDetails.downvotes}</Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium">Score</h3>
                      <Badge>{productDetails.score}</Badge>
                    </div>
                  </div>
                  
                  {voteStatus && (
                    <div className="space-y-2 border p-3 rounded-md">
                      <h3 className="text-sm font-medium">Vote Count Analysis</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Stored Upvotes: <span className="font-mono">{voteStatus.product.upvotes}</span></div>
                        <div>Actual Upvotes: <span className="font-mono">{voteStatus.directCounts.upvotes}</span></div>
                        <div>Stored Downvotes: <span className="font-mono">{voteStatus.product.downvotes}</span></div>
                        <div>Actual Downvotes: <span className="font-mono">{voteStatus.directCounts.downvotes}</span></div>
                        <div>Stored Score: <span className="font-mono">{voteStatus.product.score}</span></div>
                        <div>Actual Score: <span className="font-mono">{voteStatus.directCounts.score}</span></div>
                      </div>
                      <Badge variant={voteStatus.analysis.needsFixing ? "destructive" : "success"}>
                        {voteStatus.analysis.needsFixing ? "Needs Fixing" : "Counts Match"}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Vote buttons component from the actual UI */}
                  {mockProduct && (
                    <div className="pt-2">
                      <h3 className="text-sm font-medium mb-2">Vote UI Component</h3>
                      <VoteButtons product={mockProduct} />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Test Results */}
          {testResults.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>
                  Results from vote test execution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testResults.map((result, index) => (
                    <div key={index} className="border p-4 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">Step {index + 1}: {result.step}</h3>
                        <Badge variant="outline">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </Badge>
                      </div>
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Fix Results */}
          {fixResults && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Vote Count Fix Results</CardTitle>
                <CardDescription>
                  Results from fixing vote counts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border p-4 rounded-md">
                  <div className="mb-2">
                    <Badge variant={fixResults.success ? "success" : "destructive"}>
                      {fixResults.success ? "Success" : "Failed"}
                    </Badge>
                  </div>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(fixResults, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="all">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>All Products Vote Status</CardTitle>
                <CardDescription>
                  Check and fix vote counts across all products
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button 
                    onClick={checkAllProducts} 
                    disabled={isLoading}
                    variant="secondary"
                  >
                    Check All Products
                  </Button>
                  <Button 
                    onClick={fixAllProducts} 
                    disabled={isLoading || !allProductStatus?.needFixing}
                    variant={allProductStatus?.needFixing ? "destructive" : "secondary"}
                  >
                    Fix All Products
                  </Button>
                </div>
                
                {allProductStatus && (
                  <div className="border p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-2">Status Summary</h3>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Total Products</p>
                        <Badge variant="outline">{allProductStatus.totalProducts}</Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Need Fixing</p>
                        <Badge 
                          variant={allProductStatus.needFixing > 0 ? "destructive" : "outline"}
                        >
                          {allProductStatus.needFixing}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Errors</p>
                        <Badge 
                          variant={allProductStatus.errors > 0 ? "destructive" : "outline"}
                        >
                          {allProductStatus.errors}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Products Needing Fixes</h3>
                      <div className="max-h-60 overflow-auto">
                        {allProductStatus.products
                          .filter((product: any) => product.needsFixing)
                          .map((product: any, index: number) => (
                            <div key={index} className="border-b py-2">
                              <div className="flex justify-between">
                                <span className="font-medium">{product.name}</span>
                                <Badge variant="destructive">Needs Fixing</Badge>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs mt-1">
                                <div>
                                  <span className="text-gray-500">Upvotes: </span>
                                  <span className="font-mono">{product.stored.upvotes} → {product.actual.upvotes}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Downvotes: </span>
                                  <span className="font-mono">{product.stored.downvotes} → {product.actual.downvotes}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Score: </span>
                                  <span className="font-mono">{product.stored.score} → {product.actual.score}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        
                        {allProductStatus.products.filter((product: any) => product.needsFixing).length === 0 && (
                          <p className="text-sm text-gray-500 py-2">No products need fixing</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Fix All Results */}
            {fixAllResults && (
              <Card>
                <CardHeader>
                  <CardTitle>Fix All Results</CardTitle>
                  <CardDescription>
                    Results from fixing all product vote counts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border p-4 rounded-md">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Total Processed</p>
                        <Badge variant="outline">{fixAllResults.results.length}</Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Fixed</p>
                        <Badge variant="success">{fixAllResults.fixedCount}</Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">No Change Needed</p>
                        <Badge variant="outline">{fixAllResults.noChangeCount}</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Fixed Products</h3>
                      <div className="max-h-60 overflow-auto">
                        {fixAllResults.results
                          .filter((result: any) => result.success)
                          .map((result: any, index: number) => (
                            <div key={index} className="border-b py-2">
                              <div className="flex justify-between">
                                <span className="font-medium">{result.name}</span>
                                <Badge variant="success">Fixed</Badge>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs mt-1">
                                <div>
                                  <span className="text-gray-500">Upvotes: </span>
                                  <span className="font-mono">{result.before.upvotes} → {result.after.upvotes}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Downvotes: </span>
                                  <span className="font-mono">{result.before.downvotes} → {result.after.downvotes}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Score: </span>
                                  <span className="font-mono">{result.before.score} → {result.after.score}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        
                        {fixAllResults.results.filter((result: any) => result.success).length === 0 && (
                          <p className="text-sm text-gray-500 py-2">No products were fixed</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 