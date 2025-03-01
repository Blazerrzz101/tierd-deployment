"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useVote } from "@/hooks/use-vote"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon, AlertCircleIcon, CheckCircleIcon } from "lucide-react"

interface Product {
  id: string
  name: string
  description?: string
  upvotes: number
  downvotes: number
  userVote?: number | null
  score: number
}

export default function TestVotePage() {
  const [productId, setProductId] = useState("j1k2l3m4-n5o6-p7q8-r9s0-t1u2v3w4x5y6")
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string>("")

  const { vote, getVoteStatus, isLoading } = useVote()

  useEffect(() => {
    // Get the client ID from localStorage
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('clientId') || 'Not set'
      setClientId(storedId)
    }
  }, [])

  const fetchProduct = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const response = await fetch(`/api/products/product?id=${productId}`)
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch product")
      }
      
      setProduct(data.product)
      setSuccess("Product fetched successfully")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Error fetching product:", err)
    } finally {
      setLoading(false)
    }
  }
  
  const checkVoteStatus = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const voteStatus = await getVoteStatus(productId)
      
      if (!voteStatus.success) {
        throw new Error(voteStatus.error || "Failed to check vote status")
      }
      
      setSuccess("Vote status checked successfully")
      
      // Update product with vote information
      if (product) {
        setProduct({
          ...product,
          upvotes: voteStatus.upvotes || product.upvotes,
          downvotes: voteStatus.downvotes || product.downvotes,
          userVote: voteStatus.voteType,
          score: voteStatus.score || (voteStatus.upvotes || 0) - (voteStatus.downvotes || 0)
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Error checking vote status:", err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleUpvote = async () => {
    if (!product) return
    
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const result = await vote(product, 1)
      
      if (!result.success) {
        throw new Error(result.error || "Failed to upvote")
      }
      
      setSuccess("Upvoted successfully")
      
      // Update product with vote information
      setProduct({
        ...product,
        upvotes: result.upvotes || product.upvotes,
        downvotes: result.downvotes || product.downvotes,
        userVote: result.voteType,
        score: result.score || (result.upvotes || 0) - (result.downvotes || 0)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Error upvoting:", err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleDownvote = async () => {
    if (!product) return
    
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const result = await vote(product, -1)
      
      if (!result.success) {
        throw new Error(result.error || "Failed to downvote")
      }
      
      setSuccess("Downvoted successfully")
      
      // Update product with vote information
      setProduct({
        ...product,
        upvotes: result.upvotes || product.upvotes,
        downvotes: result.downvotes || product.downvotes,
        userVote: result.voteType,
        score: result.score || (result.upvotes || 0) - (result.downvotes || 0)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Error downvoting:", err)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Vote Testing Dashboard</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>Your anonymous client identifier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="px-3 py-1 text-sm">
              Client ID: {clientId}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                const newId = Math.random().toString(36).substring(2)
                localStorage.setItem('clientId', newId)
                setClientId(newId)
              }}
            >
              Generate New ID
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Fetch Product</CardTitle>
          <CardDescription>Get product details including vote counts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Input
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="Enter product ID"
              className="flex-1"
            />
            <Button onClick={fetchProduct} disabled={loading || isLoading}>
              Fetch Product
            </Button>
          </div>
          <div className="flex space-x-2 mt-2">
            <Button onClick={checkVoteStatus} variant="outline" disabled={loading || isLoading || !product}>
              Check Vote Status
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-6 bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-50">
          <CheckCircleIcon className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      {product && (
        <Card>
          <CardHeader>
            <CardTitle>{product.name}</CardTitle>
            <CardDescription>{product.description || "No description available"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Product Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-muted p-2 rounded">ID: {product.id}</div>
                <div className="bg-muted p-2 rounded">Score: {product.score}</div>
                <div className="bg-muted p-2 rounded">Upvotes: {product.upvotes}</div>
                <div className="bg-muted p-2 rounded">Downvotes: {product.downvotes}</div>
                <div className="bg-muted p-2 rounded col-span-2">
                  Your Vote: {product.userVote === 1 ? "Upvote ⬆️" : product.userVote === -1 ? "Downvote ⬇️" : "None"}
                </div>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex justify-center space-x-4">
              <Button 
                onClick={handleUpvote}
                disabled={loading || isLoading}
                variant={product.userVote === 1 ? "default" : "outline"}
                className="flex items-center space-x-2"
              >
                <span>Upvote</span>
                <span className="text-xs bg-primary/20 px-2 py-1 rounded-full">
                  {product.upvotes}
                </span>
              </Button>
              
              <Button 
                onClick={handleDownvote}
                disabled={loading || isLoading}
                variant={product.userVote === -1 ? "default" : "outline"}
                className="flex items-center space-x-2"
              >
                <span>Downvote</span>
                <span className="text-xs bg-primary/20 px-2 py-1 rounded-full">
                  {product.downvotes}
                </span>
              </Button>
            </div>
            
            <Separator className="my-4" />
            
            <div className="p-3 bg-muted rounded text-xs">
              <h3 className="font-medium mb-1">Debug Information</h3>
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(product, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 