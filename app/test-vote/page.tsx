"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { VoteButtons } from "@/components/products/vote-buttons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase/client";
import { useVote } from "@/hooks/use-vote";
import { useToast } from "@/components/ui/use-toast";

export default function TestVotePage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>("");
  const { vote, checkUserVote, isLoading } = useVote();
  const [voteResponse, setVoteResponse] = useState<any>(null);
  const [checkResponse, setCheckResponse] = useState<any>(null);
  const [currentVoteStatus, setCurrentVoteStatus] = useState<{[key: string]: number | null}>({});
  
  useEffect(() => {
    // Get client ID from localStorage
    try {
      const storedClientId = localStorage.getItem('tierd_client_id');
      if (storedClientId) {
        setClientId(storedClientId);
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
    
    // Get some products to test with
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, url_slug, category, price')
          .limit(5);
        
        if (error) {
          throw new Error(`Error fetching products: ${error.message}`);
        }
        
        setProducts(data || []);
        
        // Check vote status for each product
        if (data && data.length > 0) {
          const voteStatuses: {[key: string]: number | null} = {};
          for (const product of data) {
            try {
              const voteType = await checkUserVote(product.id);
              voteStatuses[product.id] = voteType;
            } catch (err) {
              console.error(`Error checking vote for ${product.id}:`, err);
            }
          }
          setCurrentVoteStatus(voteStatuses);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    
    fetchProducts();
  }, [checkUserVote]);
  
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
      
      // Update current vote status
      setCurrentVoteStatus(prev => ({
        ...prev,
        [productId]: data.voteType
      }));
      
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
      
      // Update current vote status
      setCurrentVoteStatus(prev => ({
        ...prev,
        [productId]: data.result.voteType
      }));
      
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
      
      // Update current vote status
      if (result && result.success) {
        setCurrentVoteStatus(prev => ({
          ...prev,
          [productId]: result.voteType || null
        }));
      }
      
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
      
      // Update current vote status
      setCurrentVoteStatus(prev => ({
        ...prev,
        [productId]: voteType
      }));
      
      alert(`Your vote type: ${voteType === null ? 'None' : voteType === 1 ? 'Upvote' : 'Downvote'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const testVoteApi = async (voteType: number) => {
    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: "550e8400-e29b-41d4-a716-446655440000",
          voteType,
          clientId: clientId || 'test_client'
        }),
      });
      
      const data = await response.json();
      setVoteResponse(data);
      
      // Update current vote status for this product
      setCurrentVoteStatus(prev => ({
        ...prev,
        ["550e8400-e29b-41d4-a716-446655440000"]: data.result.voteType
      }));
      
      toast({
        title: data.success ? "Vote API Success" : "Vote API Error",
        description: data.success 
          ? `Vote recorded: ${JSON.stringify(data.result)}` 
          : `Error: ${data.error || 'Unknown error'}`,
        variant: data.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Error testing vote API:', error);
      toast({
        title: "API Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  const testCheckVoteApi = async () => {
    try {
      const response = await fetch(`/api/vote?productId=550e8400-e29b-41d4-a716-446655440000&clientId=${clientId || 'test_client'}`);
      const data = await response.json();
      setCheckResponse(data);
      
      // Update current vote status for this product
      setCurrentVoteStatus(prev => ({
        ...prev,
        ["550e8400-e29b-41d4-a716-446655440000"]: data.voteType
      }));
      
      toast({
        title: data.success ? "Check Vote Success" : "Check Vote Error",
        description: data.success 
          ? `Vote status: ${data.hasVoted ? `${data.voteType === 1 ? 'Upvoted' : 'Downvoted'}` : 'No vote'}` 
          : `Error: ${data.error || 'Unknown error'}`,
        variant: data.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Error checking vote status:', error);
      toast({
        title: "API Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  // Function to display vote status
  const getVoteStatusText = (productId: string) => {
    const status = currentVoteStatus[productId];
    if (status === 1) return "You upvoted this product";
    if (status === -1) return "You downvoted this product";
    return "You haven't voted on this product";
  };
  
  const getVoteStatusColor = (productId: string) => {
    const status = currentVoteStatus[productId];
    if (status === 1) return "text-green-600";
    if (status === -1) return "text-red-600";
    return "text-gray-500";
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
                <CardDescription>{product.category} • ${product.price}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Vote using VoteButtons component:</h3>
                  <VoteButtons productId={product.id} />
                  <p className={`text-sm mt-2 ${getVoteStatusColor(product.id)}`}>
                    {getVoteStatusText(product.id)}
                  </p>
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
                        className={currentVoteStatus[product.id] === 1 ? "bg-green-100" : ""}
                      >
                        Upvote
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => testDirectVote(product.id, -1)}
                        className={currentVoteStatus[product.id] === -1 ? "bg-red-100" : ""}
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
                        className={currentVoteStatus[product.id] === 1 ? "bg-green-100" : ""}
                      >
                        Hook Upvote
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => testHookVote(product.id, -1)}
                        disabled={isLoading}
                        className={currentVoteStatus[product.id] === -1 ? "bg-red-100" : ""}
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
      
      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Vote Component Test</CardTitle>
            <CardDescription>
              Tests the VoteButtons component with the mock product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Product ID: 550e8400-e29b-41d4-a716-446655440000</p>
              <p className="text-sm text-muted-foreground mb-4">Client ID: {clientId || 'Not available'}</p>
              
              <div className="border p-4 rounded-md">
                <h3 className="font-medium mb-2">Sennheiser HD 560S</h3>
                <p className="text-sm text-muted-foreground mb-4">Reference-grade headphones for audiophiles</p>
                <VoteButtons productId="550e8400-e29b-41d4-a716-446655440000" />
                <p className={`text-sm mt-2 ${getVoteStatusColor("550e8400-e29b-41d4-a716-446655440000")}`}>
                  {getVoteStatusText("550e8400-e29b-41d4-a716-446655440000")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Direct API Tests</CardTitle>
            <CardDescription>
              Test the vote API endpoints directly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Vote API Test</h3>
                <div className="flex space-x-2 mb-2">
                  <Button 
                    onClick={() => testVoteApi(1)} 
                    variant="outline"
                    className={currentVoteStatus["550e8400-e29b-41d4-a716-446655440000"] === 1 ? "bg-green-100" : ""}
                  >
                    Upvote
                  </Button>
                  <Button 
                    onClick={() => testVoteApi(-1)} 
                    variant="outline"
                    className={currentVoteStatus["550e8400-e29b-41d4-a716-446655440000"] === -1 ? "bg-red-100" : ""}
                  >
                    Downvote
                  </Button>
                </div>
                {voteResponse && (
                  <pre className="bg-muted p-2 rounded-md text-xs overflow-auto max-h-32">
                    {JSON.stringify(voteResponse, null, 2)}
                  </pre>
                )}
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Check Vote Status</h3>
                <Button onClick={testCheckVoteApi} variant="outline" className="mb-2">
                  Check Vote
                </Button>
                {checkResponse && (
                  <pre className="bg-muted p-2 rounded-md text-xs overflow-auto max-h-32">
                    {JSON.stringify(checkResponse, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 