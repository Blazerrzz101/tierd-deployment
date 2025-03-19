"use client"

import { useState } from 'react'
import { useEnhancedAuth } from "@/hooks/enhanced-auth"
import { useVote } from '@/hooks/use-vote'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function TestAuthVotePage() {
  const { user, isAuthenticated, signIn, signOut } = useEnhancedAuth()
  const { vote, getVoteStatus } = useVote()
  
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('password123')
  const [voteStatus, setVoteStatus] = useState<any>(null)
  const [voteResult, setVoteResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Test product ID from the database - replace with a real one
  const testProductId = "3f8e7d6c-5b4a-3c2d-1e0f-9a8b7c6d5e4f"
  const testProduct = {
    id: testProductId,
    name: "Test Product"
  }

  // Handle sign in
  const handleSignIn = async () => {
    setLoading(true)
    setError(null)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  // Handle sign out
  const handleSignOut = async () => {
    setLoading(true)
    setError(null)
    try {
      await signOut()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed')
    } finally {
      setLoading(false)
    }
  }

  // Check vote status
  const checkVoteStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const status = await getVoteStatus(testProductId)
      setVoteStatus(status)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check vote status')
    } finally {
      setLoading(false)
    }
  }

  // Handle upvote
  const handleUpvote = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await vote(testProduct, 1)
      setVoteResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upvote failed')
    } finally {
      setLoading(false)
    }
  }

  // Handle downvote
  const handleDownvote = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await vote(testProduct, -1)
      setVoteResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Downvote failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-6">Auth & Vote System Test</h1>
      
      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {/* Auth state display */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</div>
            <div><strong>User ID:</strong> {user?.id || 'None'}</div>
            <div><strong>Email:</strong> {user?.email || 'None'}</div>
            <div><strong>Name:</strong> {user?.name || 'None'}</div>
            <div><strong>Is Anonymous:</strong> {user?.isAnonymous ? 'Yes' : 'No'}</div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-4">
          {!isAuthenticated ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  placeholder="Email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
                <Input 
                  placeholder="Password" 
                  type="password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </div>
              <Button onClick={handleSignIn} disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </>
          ) : (
            <Button onClick={handleSignOut} variant="destructive" disabled={loading}>
              {loading ? 'Signing out...' : 'Sign Out'}
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Vote system test */}
      <Card>
        <CardHeader>
          <CardTitle>Vote System Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div><strong>Test Product ID:</strong> {testProductId}</div>
            {voteStatus && (
              <div className="bg-gray-100 p-4 rounded">
                <h3 className="font-semibold mb-2">Vote Status:</h3>
                <pre className="text-xs overflow-auto bg-gray-800 text-white p-2 rounded">
                  {JSON.stringify(voteStatus, null, 2)}
                </pre>
              </div>
            )}
            {voteResult && (
              <div className="bg-gray-100 p-4 rounded">
                <h3 className="font-semibold mb-2">Vote Result:</h3>
                <pre className="text-xs overflow-auto bg-gray-800 text-white p-2 rounded">
                  {JSON.stringify(voteResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-4">
          <Button onClick={checkVoteStatus} variant="outline" disabled={loading}>
            {loading ? 'Checking...' : 'Check Vote Status'}
          </Button>
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={handleUpvote} className="bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? 'Voting...' : 'Upvote'}
            </Button>
            <Button onClick={handleDownvote} className="bg-red-600 hover:bg-red-700" disabled={loading}>
              {loading ? 'Voting...' : 'Downvote'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 