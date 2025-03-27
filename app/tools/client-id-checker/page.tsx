"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { getClientId, generateClientId, isValidClientId, ensureClientId } from "@/utils/client-id"

/**
 * A debug utility to check client ID generation and storage
 */
export default function ClientIdCheckerPage() {
  const [clientId, setClientId] = useState<string | null>(null)
  const [isValid, setIsValid] = useState<boolean>(false)
  const [newClientId, setNewClientId] = useState<string>("")

  // Check client ID on page load
  useEffect(() => {
    checkClientId()
  }, [])

  const checkClientId = () => {
    try {
      const id = getClientId()
      setClientId(id)
      setIsValid(isValidClientId(id))
    } catch (error) {
      console.error("Error getting client ID:", error)
      setClientId("Error: " + (error instanceof Error ? error.message : String(error)))
      setIsValid(false)
    }
  }

  const createNewClientId = () => {
    try {
      // Generate a new client ID
      const id = generateClientId()
      setNewClientId(id)
    } catch (error) {
      console.error("Error generating client ID:", error)
      setNewClientId("Error: " + (error instanceof Error ? error.message : String(error)))
    }
  }

  const saveNewClientId = () => {
    try {
      if (newClientId) {
        localStorage.setItem('clientId', newClientId)
        checkClientId()
        setNewClientId("")
      }
    } catch (error) {
      console.error("Error saving client ID:", error)
    }
  }

  const ensureValidClientId = () => {
    try {
      const id = ensureClientId()
      setClientId(id)
      setIsValid(isValidClientId(id))
    } catch (error) {
      console.error("Error ensuring client ID:", error)
    }
  }

  const clearStoredClientId = () => {
    try {
      localStorage.removeItem('clientId')
      checkClientId()
    } catch (error) {
      console.error("Error clearing client ID:", error)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Client ID Checker</h1>
      <p className="text-muted-foreground mb-8">
        This utility helps diagnose issues with client ID generation and storage.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Client ID</CardTitle>
            <CardDescription>
              The client ID currently stored in localStorage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Client ID Value</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-muted p-2 rounded text-sm flex-1 overflow-auto">
                    {clientId || 'No client ID found'}
                  </code>
                  <Badge variant={isValid ? "default" : "destructive"}>
                    {isValid ? "Valid" : "Invalid"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={checkClientId}>Refresh</Button>
                <Button variant="outline" onClick={clearStoredClientId}>Clear</Button>
                <Button variant="secondary" onClick={ensureValidClientId}>Ensure Valid</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generate New Client ID</CardTitle>
            <CardDescription>
              Create and store a new client ID
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>New Client ID</Label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    value={newClientId} 
                    onChange={(e) => setNewClientId(e.target.value)}
                    placeholder="Generate or enter a client ID"
                  />
                  <Button onClick={createNewClientId} variant="outline">Generate</Button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={saveNewClientId} 
              disabled={!newClientId}
            >
              Save New Client ID
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
            <CardDescription>
              Technical details about client ID and localStorage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">localStorage Contents</h3>
                <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-60">
                  {typeof window !== 'undefined' 
                    ? JSON.stringify(
                        Object.fromEntries(
                          Object.keys(localStorage).map(key => [key, localStorage.getItem(key)])
                        ),
                        null,
                        2
                      )
                    : 'Server-side rendering - localStorage not available'}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 