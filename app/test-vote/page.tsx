"use client"

import { useState, useEffect } from "react"
import { useVote } from "@/hooks/use-vote"
import { VoteButtons } from "@/components/products/vote-buttons"
import { useEnhancedAuth } from "@/hooks/enhanced-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"

export default function TestVotePage() {
  const { user, isLoading, signIn, signUp, signOut, isAuthenticated } = useEnhancedAuth()
  const { getVoteStatus, vote, getClientId, remainingVotes } = useVote()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [voteStatus, setVoteStatus] = useState<any>(null)
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isTestingApi, setIsTestingApi] = useState(false)

  // Test products
  const testProducts = [
    { id: "9dd2bfe2-6eef-40de-ae12-c35ff1975914", name: "Logitech G502 HERO" },
    { id: "c582a43d-ab13-4f3c-9ed2-e6a3a149b859", name: "SteelSeries Arctis 7" },
    { id: "31a2cf45-b04c-48be-a222-b5aaede94a64", name: "Razer BlackWidow V3" }
  ]

  // Test API directly
  const testVoteAPI = async (productId: string) => {
    setIsTestingApi(true)
    setApiError(null)
    
    try {
      const clientId = getClientId()
      const response = await fetch(`/api/vote?productId=${productId}&clientId=${clientId}`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      setVoteStatus(data);
      setApiResponse({
        endpoint: `/api/vote?productId=${productId}&clientId=${clientId}`,
        method: 'GET',
        response: data
      });
    } catch (error) {
      console.error("Error testing vote API:", error);
      setApiError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsTestingApi(false)
    }
  };

  // Test submitting a vote
  const testSubmitVote = async (productId: string, voteType: 1 | -1) => {
    setIsTestingApi(true)
    setApiError(null)
    
    try {
      const clientId = getClientId()
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          voteType,
          clientId
        })
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update vote status after submitting
      await testVoteAPI(productId);
      
      setApiResponse({
        endpoint: '/api/vote',
        method: 'POST',
        body: { productId, voteType, clientId },
        response: data
      });
    } catch (error) {
      console.error("Error submitting vote:", error);
      setApiError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsTestingApi(false)
    }
  };

  // Test remaining votes
  const testRemainingVotes = async () => {
    setIsTestingApi(true)
    setApiError(null)
    
    try {
      const clientId = getClientId()
      const response = await fetch(`/api/vote/remaining-votes?clientId=${clientId}`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      setApiResponse({
        endpoint: `/api/vote/remaining-votes?clientId=${clientId}`,
        method: 'GET',
        response: data
      });
    } catch (error) {
      console.error("Error checking remaining votes:", error);
      setApiError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsTestingApi(false)
    }
  };

  useEffect(() => {
    if (testProducts.length > 0) {
      testVoteAPI(testProducts[0].id);
    }
  }, []);

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-6">Voting System Test</h1>

      <Tabs defaultValue="voting">
        <TabsList className="mb-4">
          <TabsTrigger value="voting">Voting</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="api">API Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="voting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vote Buttons Test</CardTitle>
              <CardDescription>
                Test the voting functionality on these products
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {testProducts.map(product => (
                <div key={product.id} className="flex items-center justify-between border p-3 rounded">
                  <div>
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">ID: {product.id}</p>
                  </div>
                  <VoteButtons 
                    product={product}
                    initialUpvotes={5}
                    initialDownvotes={2}
                  />
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {user?.isAnonymous 
                    ? `Anonymous user (${remainingVotes ?? '?'} votes remaining)`
                    : `Signed in as ${user?.name || user?.email || 'Unknown User'}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Client ID: {getClientId() || 'Not available'}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => testProducts.forEach(p => testVoteAPI(p.id))}
                disabled={isTestingApi}
              >
                {isTestingApi ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refreshing...
                  </>
                ) : "Refresh Vote Status"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="auth" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Test</CardTitle>
              <CardDescription>
                Test signing in and out to verify vote persistence
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAuthenticated && user && !user.isAnonymous ? (
                <div className="space-y-4">
                  <div className="p-4 border rounded bg-muted/50">
                    <h3 className="font-medium mb-2">User Profile</h3>
                    <p><strong>Name:</strong> {user.name || 'Not set'}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>ID:</strong> {user.id}</p>
                    <p><strong>Anonymous:</strong> {user.isAnonymous ? 'Yes' : 'No'}</p>
                  </div>
                  <Button onClick={() => signOut()} className="w-full">Sign Out</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="your@email.com" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name (for sign up only)</Label>
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="Your Name" 
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={() => signIn(email, password)} className="flex-1" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Sign In
                    </Button>
                    <Button onClick={() => signUp(email, password, name)} className="flex-1" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Sign Up
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Testing</CardTitle>
              <CardDescription>
                Test the voting API endpoints directly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Test Products</Label>
                <div className="flex flex-wrap gap-2">
                  {testProducts.map(product => (
                    <Button 
                      key={product.id} 
                      variant="outline" 
                      size="sm"
                      disabled={isTestingApi}
                      onClick={() => testVoteAPI(product.id)}
                    >
                      Check {product.name}
                    </Button>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Vote Actions</Label>
                {testProducts.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{testProducts[0].name}:</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-green-500/10 hover:bg-green-500/20"
                        onClick={() => testSubmitVote(testProducts[0].id, 1)}
                        disabled={isTestingApi}
                      >
                        Upvote
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-red-500/10 hover:bg-red-500/20"
                        onClick={() => testSubmitVote(testProducts[0].id, -1)}
                        disabled={isTestingApi}
                      >
                        Downvote
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Other Endpoints</Label>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={testRemainingVotes}
                    disabled={isTestingApi}
                  >
                    Check Remaining Votes
                  </Button>
                </div>
              </div>
              
              {apiError && (
                <div className="p-3 border border-red-200 bg-red-50 text-red-700 rounded mt-4">
                  <p className="font-medium">Error:</p>
                  <p className="text-sm">{apiError}</p>
                </div>
              )}

              {apiResponse && (
                <div className="mt-4 p-4 border rounded bg-muted overflow-auto">
                  <p className="font-medium mb-2">API Response</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <span className="font-mono">{apiResponse.method}</span> <span>{apiResponse.endpoint}</span>
                  </p>
                  {apiResponse.body && (
                    <div className="mb-2">
                      <p className="text-sm font-medium">Request Body:</p>
                      <pre className="text-xs bg-muted-foreground/10 p-2 rounded overflow-auto">
                        {JSON.stringify(apiResponse.body, null, 2)}
                      </pre>
                    </div>
                  )}
                  <p className="text-sm font-medium">Response:</p>
                  <pre className="text-xs bg-muted-foreground/10 p-2 rounded overflow-auto">
                    {JSON.stringify(apiResponse.response, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 