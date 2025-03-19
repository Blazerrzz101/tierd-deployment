"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/home/main-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ArrowUp, ArrowDown, FileJson, RefreshCcw, Activity, CheckCircle, XCircle, Clock } from "lucide-react"
import { getClientId } from "@/utils/client-id"
import { useEnhancedAuth } from "@/hooks/enhanced-auth"
import { useRouter } from "next/navigation"

export default function VoteStatusPage() {
  const [voteState, setVoteState] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [testProduct, setTestProduct] = useState("test-product-1")
  const [testClientId, setTestClientId] = useState("")
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [updateCount, setUpdateCount] = useState(0)
  const { user } = useEnhancedAuth()
  const router = useRouter()
  
  // For vote testing
  const [testVoteType, setTestVoteType] = useState<string>("1")
  
  // For event source connection
  let eventSource: EventSource | null = null
  
  useEffect(() => {
    // Set default test client ID
    setTestClientId(getClientId())
    
    // Fetch current vote state
    fetchVoteState()
    
    // Connect to real-time updates
    connectToEventSource()
    
    return () => {
      // Clean up event source when component unmounts
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [])
  
  const fetchVoteState = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/vote/state')
      
      if (response.ok) {
        const data = await response.json()
        setVoteState(data.voteState)
      } else {
        console.error('Error fetching vote state:', response.statusText)
        toast.error('Failed to load vote state')
      }
    } catch (error) {
      console.error('Error fetching vote state:', error)
      toast.error('Failed to load vote state')
    } finally {
      setLoading(false)
    }
  }
  
  const connectToEventSource = () => {
    if (typeof window === 'undefined') return
    
    // Close existing connection
    if (eventSource) {
      eventSource.close()
    }
    
    // Connect to SSE endpoint
    setConnectionStatus("connecting")
    eventSource = new EventSource('/api/vote/updates')
    
    // Handle connection open
    eventSource.onopen = () => {
      setConnectionStatus("connected")
    }
    
    // Handle connection error
    eventSource.onerror = () => {
      setConnectionStatus("disconnected")
      // Try to reconnect after 5 seconds
      setTimeout(() => {
        connectToEventSource()
      }, 5000)
    }
    
    // Handle vote updates
    eventSource.addEventListener('vote-update', (event) => {
      try {
        const data = JSON.parse(event.data)
        setVoteState(data.voteState)
        setLastUpdate(new Date())
        setUpdateCount(prev => prev + 1)
      } catch (error) {
        console.error('Error parsing vote update:', error)
      }
    })
  }
  
  const handleTestVote = async () => {
    try {
      // Validate input
      if (!testProduct || !testClientId) {
        toast.error('Please provide both product ID and client ID')
        return
      }
      
      // Convert vote type to number
      const voteTypeNum = parseInt(testVoteType, 10)
      
      // Call vote API
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: testProduct,
          clientId: testClientId,
          voteType: voteTypeNum
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast.success(`Vote successful! Type: ${voteTypeNum}`)
        } else {
          toast.error(`Vote failed: ${data.error}`)
        }
      } else {
        toast.error('Failed to submit vote')
      }
    } catch (error) {
      console.error('Error submitting vote:', error)
      toast.error('Error submitting vote')
    }
  }
  
  // Format the vote count display
  const formatVoteCount = (count: number = 0) => {
    return count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count
  }
  
  return (
    <MainLayout>
      <div className="container py-10 max-w-6xl">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">Voting System Status</CardTitle>
                <CardDescription>
                  Monitor and manage the voting system.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={
                    connectionStatus === "connected" ? "success" :
                    connectionStatus === "connecting" ? "warning" : "destructive"
                  }
                  className={
                    connectionStatus === "connecting" ? "animate-pulse" : ""
                  }
                >
                  {connectionStatus === "connected" && <CheckCircle className="h-3 w-3 mr-1" />}
                  {connectionStatus === "connecting" && <Clock className="h-3 w-3 mr-1" />}
                  {connectionStatus === "disconnected" && <XCircle className="h-3 w-3 mr-1" />}
                  {connectionStatus === "connected" ? "Live Updates" : 
                   connectionStatus === "connecting" ? "Connecting..." : "Disconnected"}
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchVoteState}
                  disabled={loading}
                >
                  <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                {!user && (
                  <Button variant="default" size="sm" onClick={() => router.push('/auth/sign-in')}>
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="text-2xl font-bold">
                    {voteState ? Object.keys(voteState.votes).length : "—"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {voteState?.lastUpdated ? `Last updated: ${new Date(voteState.lastUpdated).toLocaleString()}` : ""}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-sm font-medium">Products Voted</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="text-2xl font-bold">
                    {voteState ? Object.keys(voteState.voteCounts).length : "—"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Unique products that have received votes
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-sm font-medium">Vote Activity</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="text-2xl font-bold">
                    {voteState ? voteState.userVotes.length : "—"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total vote actions recorded
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Tabs defaultValue="products" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="recent">Recent Activity</TabsTrigger>
                <TabsTrigger value="debug">Debug</TabsTrigger>
              </TabsList>
              
              <TabsContent value="products" className="space-y-4">
                {voteState && Object.entries(voteState.voteCounts).length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(voteState.voteCounts)
                        .sort(([, a]: [string, any], [, b]: [string, any]) => 
                          (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
                        )
                        .map(([productId, counts]: [string, any]) => (
                          <Card key={productId}>
                            <CardHeader className="py-4">
                              <CardTitle className="text-sm font-medium truncate">
                                <span title={productId}>{productId}</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="py-2">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <ArrowUp className="text-green-500 h-4 w-4 mr-1" />
                                  <span className="text-green-500 font-medium">{formatVoteCount(counts.upvotes)}</span>
                                </div>
                                <div className="text-lg font-bold">
                                  {formatVoteCount(counts.upvotes - counts.downvotes)}
                                </div>
                                <div className="flex items-center">
                                  <ArrowDown className="text-red-500 h-4 w-4 mr-1" />
                                  <span className="text-red-500 font-medium">{formatVoteCount(counts.downvotes)}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      }
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No votes recorded yet</h3>
                    <p className="text-muted-foreground">
                      Votes will appear here once products receive votes.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="recent" className="space-y-4">
                {voteState && voteState.userVotes.length > 0 ? (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {voteState.userVotes
                      .sort((a: any, b: any) => 
                        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                      )
                      .slice(0, 50)
                      .map((vote: any, index: number) => (
                        <Card key={`${vote.productId}-${vote.clientId}-${index}`}>
                          <CardContent className="py-4 flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium mb-1">
                                {vote.voteType === 1 ? (
                                  <ArrowUp className="inline text-green-500 h-4 w-4 mr-1" />
                                ) : vote.voteType === -1 ? (
                                  <ArrowDown className="inline text-red-500 h-4 w-4 mr-1" />
                                ) : (
                                  <span className="text-muted-foreground mr-1">●</span>
                                )}
                                <span>
                                  {vote.voteType === 1 ? "Upvote" : 
                                   vote.voteType === -1 ? "Downvote" : "Removed vote"}
                                </span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Product: <span className="font-mono">{vote.productId}</span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Client: <span className="font-mono">{vote.clientId.substring(0, 8)}...</span>
                              </p>
                            </div>
                            <div className="text-xs text-right">
                              {new Date(vote.timestamp).toLocaleString()}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    }
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No recent activity</h3>
                    <p className="text-muted-foreground">
                      Vote activity will appear here once recorded.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="debug" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Test Voting</CardTitle>
                    <CardDescription>
                      Submit test votes to verify the voting system.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="product-id">Product ID</Label>
                          <Input 
                            id="product-id" 
                            value={testProduct}
                            onChange={(e) => setTestProduct(e.target.value)}
                            placeholder="Enter product ID"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="client-id">Client ID</Label>
                          <Input 
                            id="client-id" 
                            value={testClientId}
                            onChange={(e) => setTestClientId(e.target.value)}
                            placeholder="Enter client ID"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="vote-type">Vote Type</Label>
                          <Select
                            value={testVoteType}
                            onValueChange={setTestVoteType}
                          >
                            <SelectTrigger id="vote-type">
                              <SelectValue placeholder="Select vote type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Upvote (+1)</SelectItem>
                              <SelectItem value="0">Neutral (0)</SelectItem>
                              <SelectItem value="-1">Downvote (-1)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Current Connection Status</Label>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                              connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            <span className="capitalize">{connectionStatus}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Updates Received</Label>
                          <div>{updateCount}</div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Last Update</Label>
                          <div>{lastUpdate ? lastUpdate.toLocaleString() : 'Never'}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={connectToEventSource}
                      disabled={connectionStatus === 'connected'}
                    >
                      Reconnect
                    </Button>
                    <Button onClick={handleTestVote}>
                      Submit Test Vote
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Raw Vote State</CardTitle>
                    <CardDescription>
                      Raw JSON representation of the current vote state
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted rounded-md p-4 overflow-auto max-h-[400px]">
                      <pre className="text-xs">
                        <code>
                          {voteState ? JSON.stringify(voteState, null, 2) : 'Loading...'}
                        </code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
} 