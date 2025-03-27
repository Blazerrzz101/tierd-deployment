"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { GlobalVoteButtons } from "@/components/products/global-vote-buttons"
import { ProductVoteWrapper } from "@/components/products/product-vote-wrapper"
import { RefreshCw, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

/**
 * This is a test page that demonstrates how the global vote system works.
 * 
 * It shows multiple instances of the vote buttons for the same product, 
 * demonstrating that votes are synchronized across components.
 */
export default function TestGlobalVotesPage() {
  const [selectedProductId, setSelectedProductId] = useState("1")
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Hard-coded test products
  const testProducts = [
    { id: "1", name: "Logitech G Pro" },
    { id: "2", name: "Razer DeathAdder" },
    { id: "3", name: "SteelSeries Arctis 7" }
  ]
  
  // Force a refresh of the UI
  const forceRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 100)
  }
  
  const selectedProduct = testProducts.find(p => p.id === selectedProductId) || testProducts[0]
  
  return (
    <div className="container py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Global Vote System Test</h1>
            <p className="text-muted-foreground mt-1">
              This page demonstrates that votes are consistently tracked across different components
            </p>
          </div>
          <Button onClick={forceRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh UI
          </Button>
        </div>
        
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>How to test the global vote system</AlertTitle>
          <AlertDescription>
            Vote on one of the components below and watch how the vote is reflected across all instances of the same product.
            This demonstrates that votes are properly tracked globally using React Query.
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {testProducts.map(product => (
            <Button
              key={product.id}
              onClick={() => setSelectedProductId(product.id)}
              variant={selectedProductId === product.id ? "default" : "outline"}
              className="h-auto py-3"
            >
              {product.name}
            </Button>
          ))}
        </div>
        
        <Tabs defaultValue="demo" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="demo">Demo</TabsTrigger>
            <TabsTrigger value="explanation">How It Works</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
          </TabsList>
          
          <TabsContent value="demo" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Component 1</CardTitle>
                  <CardDescription>
                    This vote button is rendered independently
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  {!isRefreshing && (
                    <ProductVoteWrapper product={selectedProduct}>
                      {(voteData) => (
                        <div className="text-center">
                          <GlobalVoteButtons product={selectedProduct} />
                          <div className="mt-4 text-sm text-muted-foreground">
                            <div>Upvotes: {voteData.upvotes}</div>
                            <div>Downvotes: {voteData.downvotes}</div>
                            <div>Your vote: {voteData.voteType === 1 ? "Up" : voteData.voteType === -1 ? "Down" : "None"}</div>
                          </div>
                        </div>
                      )}
                    </ProductVoteWrapper>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Component 2</CardTitle>
                  <CardDescription>
                    Another independent instance, votes stay in sync
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  {!isRefreshing && (
                    <ProductVoteWrapper product={selectedProduct}>
                      {(voteData) => (
                        <div className="text-center">
                          <GlobalVoteButtons product={selectedProduct} />
                          <div className="mt-4 text-sm text-muted-foreground">
                            <div>Upvotes: {voteData.upvotes}</div>
                            <div>Downvotes: {voteData.downvotes}</div>
                            <div>Your vote: {voteData.voteType === 1 ? "Up" : voteData.voteType === -1 ? "Down" : "None"}</div>
                          </div>
                        </div>
                      )}
                    </ProductVoteWrapper>
                  )}
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Vote Details</CardTitle>
                  <CardDescription>
                    Complete vote information from the global vote cache
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!isRefreshing && (
                    <ProductVoteWrapper product={selectedProduct}>
                      {(voteData) => (
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
                          <pre className="text-sm">
                            {JSON.stringify(
                              {
                                productId: selectedProduct.id,
                                productName: selectedProduct.name,
                                score: voteData.score,
                                upvotes: voteData.upvotes,
                                downvotes: voteData.downvotes,
                                voteType: voteData.voteType,
                                isLoading: voteData.isLoading
                              }, 
                              null, 
                              2
                            )}
                          </pre>
                        </div>
                      )}
                    </ProductVoteWrapper>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="explanation" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>How the Global Vote System Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h3 className="text-lg font-semibold">Architecture</h3>
                <p>The global vote system uses React Query to maintain a centralized cache of vote status for each product. This ensures that all components displaying votes for the same product show consistent data.</p>
                
                <h3 className="text-lg font-semibold mt-4">Key Components</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>useGlobalVotes hook</strong> - Central hook that provides vote queries and mutations</li>
                  <li><strong>ProductVoteWrapper</strong> - Wrapper component that fetches vote data from the global cache</li>
                  <li><strong>GlobalVoteButtons</strong> - UI component for voting that uses the global system</li>
                </ul>
                
                <h3 className="text-lg font-semibold mt-4">Data Flow</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>User votes on a product using any GlobalVoteButtons instance</li>
                  <li>Vote mutation is triggered and updates the server</li>
                  <li>React Query invalidates the vote status query for that product</li>
                  <li>All components using ProductVoteWrapper automatically update</li>
                </ol>
                
                <Separator className="my-6" />
                
                <h3 className="text-lg font-semibold">Benefits</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Consistent voting experience across all parts of the site</li>
                  <li>Reduced redundant API calls with shared data</li>
                  <li>Automatic synchronization between components</li>
                  <li>Improved UX by preventing inconsistent vote states</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="api" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Vote API Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">GET /api/vote</h3>
                  <p className="text-sm text-muted-foreground mb-2">Get the current vote status for a product</p>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
                    <pre className="text-xs">
{`// Request
GET /api/vote?productId=1&clientId=123456

// Response
{
  "success": true,
  "productId": "1",
  "upvotes": 10,
  "downvotes": 3,
  "voteType": 1,  // 1 = upvote, -1 = downvote, null = no vote
  "hasVoted": true,
  "score": 7
}`}
                    </pre>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold">POST /api/vote</h3>
                  <p className="text-sm text-muted-foreground mb-2">Submit a vote for a product</p>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
                    <pre className="text-xs">
{`// Request
POST /api/vote
{
  "productId": "1",
  "clientId": "123456",
  "voteType": 1  // 1 = upvote, -1 = downvote, null = remove vote
}

// Response
{
  "success": true,
  "productId": "1",
  "upvotes": 11,  // Updated count
  "downvotes": 3,
  "voteType": 1,
  "hasVoted": true,
  "score": 8
}`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 