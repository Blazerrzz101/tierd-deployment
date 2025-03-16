"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowRight, CheckCircle, Wrench, Bug, RefreshCw, Github } from 'lucide-react';
import Link from 'next/link';

export default function VoteToolsPage() {
  const [loading, setLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  
  const checkSystemStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vote-system-fix');
      const data = await response.json();
      setSystemStatus(data);
    } catch (error) {
      console.error('Error checking system status:', error);
      setSystemStatus({
        isFixed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Check status on first load
  if (!systemStatus && !loading) {
    checkSystemStatus();
  }
  
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-2">Vote System Tools</h1>
      <p className="text-gray-500 mb-8">
        This page provides access to tools for testing, debugging, and fixing vote-related issues.
      </p>
      
      {/* System Status Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Vote System Status
            {systemStatus?.isFixed ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : loading ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <Bug className="h-5 w-5 text-red-500" />
            )}
          </CardTitle>
          <CardDescription>
            Current status of the voting system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : systemStatus ? (
            <div className="space-y-2">
              <Alert variant={systemStatus.isFixed ? "default" : "destructive"}>
                <AlertTitle className="flex items-center gap-2">
                  {systemStatus.isFixed ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      System Working Correctly
                    </>
                  ) : (
                    <>
                      <Bug className="h-4 w-4" />
                      System Needs Fixing
                    </>
                  )}
                </AlertTitle>
                <AlertDescription>
                  {systemStatus.isFixed
                    ? "The vote system is working correctly. All functions have the right signatures and vote counts are accurate."
                    : "The vote system needs fixing. Use the tools below to apply fixes."}
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-medium mb-2">Function Test</h3>
                  <div className={`text-sm ${systemStatus.functionTest?.success ? 'text-green-600' : 'text-red-600'}`}>
                    {systemStatus.functionTest?.success ? 'Passed' : 'Failed'}
                  </div>
                  {systemStatus.functionTest?.error && (
                    <div className="text-xs text-red-500 mt-1">
                      {systemStatus.functionTest.error}
                    </div>
                  )}
                </div>
                
                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-medium mb-2">Product Test</h3>
                  <div className={`text-sm ${systemStatus.productTest?.success ? 'text-green-600' : 'text-red-600'}`}>
                    {systemStatus.productTest?.success ? 'Passed' : 'Failed'}
                  </div>
                  {systemStatus.productTest?.error && (
                    <div className="text-xs text-red-500 mt-1">
                      {systemStatus.productTest.error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertTitle>Status Unknown</AlertTitle>
              <AlertDescription>
                Unable to determine the system status. Click "Check Status" to try again.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={checkSystemStatus} disabled={loading}>
            {loading ? 'Checking...' : 'Check Status'}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Available Tools */}
      <h2 className="text-2xl font-bold mb-4">Available Tools</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* System Fix */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              System Fix
            </CardTitle>
            <CardDescription>
              Apply SQL fixes to repair vote function signatures
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-gray-500 mb-4">
              This tool applies direct SQL migrations to fix the vote system function signatures
              and parameter order. Admin access required.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/test/vote-system-fix" className="w-full">
              <Button className="w-full">
                Open System Fix
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        {/* Vote Test Page */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Vote Testing
            </CardTitle>
            <CardDescription>
              Test voting functionality and fix vote counts
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-gray-500 mb-4">
              Run vote tests on sample products, check vote counts against database values,
              and fix discrepancies in individual or all products.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/test/vote" className="w-full">
              <Button className="w-full">
                Open Vote Test
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        {/* Vote Debug */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              Debug API
            </CardTitle>
            <CardDescription>
              Direct access to vote debug API endpoints
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-gray-500 mb-4">
              Access raw API endpoints for debugging vote functionality,
              checking database schema, and testing functions directly.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Link href="/api/vote-debug?mode=all" target="_blank" className="w-full">
              <Button variant="outline" className="w-full">
                Debug All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/api/vote-debug?mode=schema" target="_blank" className="w-full">
              <Button variant="outline" className="w-full">
                Schema Debug
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
      
      {/* Documentation */}
      <h2 className="text-2xl font-bold mb-4">Documentation</h2>
      <Card>
        <CardHeader>
          <CardTitle>Vote System Overview</CardTitle>
          <CardDescription>
            How the voting system works and common issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Vote Function Signatures</h3>
              <p className="text-sm text-gray-500 mt-1">
                The voting system uses two main PostgreSQL functions:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-500 mt-2 space-y-1">
                <li><code>vote_for_product(p_product_id, p_vote_type, p_user_id, p_client_id)</code> - Casts a vote</li>
                <li><code>has_user_voted(p_product_id, p_user_id, p_client_id)</code> - Checks if user voted</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Common Issues</h3>
              <ul className="list-disc list-inside text-sm text-gray-500 mt-2 space-y-1">
                <li>Function signature mismatches between client and server</li>
                <li>NaN values in vote counts due to improper type handling</li>
                <li>Vote counts in the product table not matching actual votes</li>
                <li>Client ID tracking for anonymous users not working properly</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Fix Process</h3>
              <ol className="list-decimal list-inside text-sm text-gray-500 mt-2 space-y-1">
                <li>Run system check to identify issues</li>
                <li>Apply SQL fixes to correct function signatures</li>
                <li>Fix vote counts in product table</li>
                <li>Test voting functionality to ensure it works</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 