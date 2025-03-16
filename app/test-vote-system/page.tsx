"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { VoteButtons } from "@/components/products/vote-buttons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useVote } from "@/hooks/use-vote";

export default function TestVoteSystemPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>('');
  const { vote, checkUserVote, isLoading } = useVote();
  
  useEffect(() => {
    // Get client ID from localStorage
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('tierd_client_id') || '';
      setClientId(id);
    }
    
    // Get some products to test with
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products');
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        setProducts(data.products.slice(0, 5) || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    
    fetchProducts();
  }, []);
  
  const testDirectApi = async (productId: string) => {
    try {
      setLoading(true);
      
      // Call our API directly
      const response = await fetch(`/api/vote?productId=${productId}&clientId=${clientId}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      alert(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const testDirectVote = async (productId: string, voteType: number) => {
    try {
      setLoading(true);
      
      // Call our API directly
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          voteType,
          clientId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Vote Response:', data);
      
      alert(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const testHookVote = async (productId: string, voteType: number) => {
    try {
      setLoading(true);
      
      // Call the vote hook
      const result = await vote({ id: productId }, voteType);
      
      console.log('Hook Vote Result:', result);
      
      alert(JSON.stringify(result, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const testCheckVote = async (productId: string) => {
    try {
      setLoading(true);
      
      // Call the checkUserVote hook
      const voteType = await checkUserVote(productId);
      
      console.log('Check Vote Result:', { voteType });
      
      alert(`Your vote type: ${voteType === null ? 'None' : voteType === 1 ? 'Upvote' : 'Downvote'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Vote System Test</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Your Client ID</h2>
        <div className="flex items-center gap-2">
          <Input value={clientId} readOnly className="font-mono" />
          <Button onClick={() => {
            const newId = `test-${Date.now()}`;
            localStorage.setItem('tierd_client_id', newId);
            setClientId(newId);
          }}>
            Generate New
          </Button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          This is the client ID used to track your votes as an anonymous user
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p>Loading products...</p>
        ) : (
          products.map(product => (
            <Card key={product.id}>
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription>{product.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Vote using VoteButtons component:</h3>
                  <VoteButtons productId={product.id} />
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Test direct API calls:</h3>
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => testDirectApi(product.id)}
                    >
                      Check Vote Status
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => testDirectVote(product.id, 1)}
                      >
                        Upvote
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => testDirectVote(product.id, -1)}
                      >
                        Downvote
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-2">Test hook functions:</h3>
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => testCheckVote(product.id)}
                      disabled={isLoading}
                    >
                      Check Vote with Hook
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => testHookVote(product.id, 1)}
                        disabled={isLoading}
                      >
                        Hook Upvote
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => testHookVote(product.id, -1)}
                        disabled={isLoading}
                      >
                        Hook Downvote
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="text-sm text-gray-500">
                ID: {product.id}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 