'use client';

import { useState, useEffect } from 'react';
import { useVoteUpdates } from '../hooks/use-vote-updates';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function VoteStatus() {
  const { connected, error, voteCounts, lastUpdated } = useVoteUpdates();
  const [expanded, setExpanded] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  
  // Calculate total votes whenever voteCounts changes
  useEffect(() => {
    let total = 0;
    Object.values(voteCounts).forEach(counts => {
      total += counts.upvotes + counts.downvotes;
    });
    setTotalVotes(total);
  }, [voteCounts]);
  
  // Format the last updated time
  const formatLastUpdated = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // If less than a minute, show seconds
    if (diffMs < 60000) {
      const seconds = Math.floor(diffMs / 1000);
      return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
    }
    
    // If less than an hour, show minutes
    if (diffMs < 3600000) {
      const minutes = Math.floor(diffMs / 60000);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    // Otherwise show hours
    const hours = Math.floor(diffMs / 3600000);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  };
  
  // Test the voting system
  const testVote = async () => {
    try {
      // Random product ID from the list of 10 products
      const productIds = [
        'j1k2l3m4-n5o6-p7q8-r9s0-t1u2v3w4x5y6',
        'c8d9e0f1-2a3b-4c5d-6e7f-8g9h0i1j2k3l',
        '9dd2bfe2-6eef-40de-ae12-c35ff1975914',
        'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
        'q1w2e3r4-t5y6-u7i8-o9p0-a1s2d3f4g5h6',
        'z1x2c3v4-b5n6-m7k8-j9h0-g1f2d3s4a5',
        'p9o8i7u6-y5t4-r3e2-w1q0-z9x8c7v6b5',
        'n4m3b2v1-c8x7z6-p5o4i3-u2y1t0-r9e8w7q6',
        'l5k4j3h2-g1f0d9-s8a7p6-o5i4u3-y2t1r0e9',
        'w9q8e7r6-t5y4u3-i2o1p0-a9s8d7-f6g5h4j3'
      ];
      
      const randomProductId = productIds[Math.floor(Math.random() * productIds.length)];
      const randomVoteType = Math.random() > 0.5 ? 1 : -1;
      
      toast.loading(`Testing vote: ${randomVoteType > 0 ? 'upvote' : 'downvote'}`);
      
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: randomProductId,
          voteType: randomVoteType,
          clientId: `test-client-${Date.now()}`
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Vote test successful! ${randomVoteType > 0 ? '👍' : '👎'}`);
      } else {
        toast.error(`Vote test failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error(`Vote test failed: ${error}`);
    }
  };
  
  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Voting System Status</CardTitle>
          <Badge variant={connected ? "success" : "destructive"}>
            {connected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
        <CardDescription>
          Real-time vote tracking system status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 text-red-800 p-2 rounded mb-2 text-sm">
            Error: {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-1 text-sm">
          <div className="text-muted-foreground">Status:</div>
          <div>{connected ? "Connected" : "Disconnected"}</div>
          
          <div className="text-muted-foreground">Total Votes:</div>
          <div>{totalVotes}</div>
          
          <div className="text-muted-foreground">Last Updated:</div>
          <div>{formatLastUpdated(lastUpdated)}</div>
        </div>
        
        {expanded && (
          <div className="mt-3 border-t pt-3">
            <h4 className="text-sm font-medium mb-2">Vote Counts by Product</h4>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {Object.entries(voteCounts).map(([productId, counts]) => (
                <div key={productId} className="text-xs grid grid-cols-4 gap-1">
                  <div className="col-span-2 truncate" title={productId}>{productId}</div>
                  <div className="text-green-600">👍 {counts.upvotes}</div>
                  <div className="text-red-600">👎 {counts.downvotes}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-1">
        <Button variant="secondary" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Hide Details" : "Show Details"}
        </Button>
        <Button variant="outline" size="sm" onClick={testVote}>
          Test Vote
        </Button>
      </CardFooter>
    </Card>
  );
} 