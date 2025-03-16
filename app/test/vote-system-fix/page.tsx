"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Play, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function VoteSystemFixPage() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [adminToken, setAdminToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  // Check the system status on page load
  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      setChecking(true);
      const response = await fetch('/api/vote-system-fix');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error checking system status:', error);
      setStatus({
        isFixed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setChecking(false);
    }
  };

  const applyFix = async () => {
    try {
      setLoading(true);
      setResults(null);

      const response = await fetch('/api/vote-system-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          authToken: adminToken
        })
      });

      const data = await response.json();
      setResults(data);

      // If successful, update the status
      if (data.success) {
        await checkSystemStatus();
      }
    } catch (error) {
      console.error('Error applying fix:', error);
      setResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Vote System Fix</h1>
      <p className="mb-6 text-gray-500">
        This page allows you to check and fix issues with the voting system.
        The fix will directly apply SQL updates to correct function signatures and vote counts.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {/* System Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              System Status
              {status?.isFixed ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </CardTitle>
            <CardDescription>
              Current status of the vote system functions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {checking ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : status ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Function Test:</span>
                  <Badge variant={status.functionTest?.success ? "success" : "destructive"}>
                    {status.functionTest?.success ? "Passed" : "Failed"}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-medium">Product Test:</span>
                  <Badge variant={status.productTest?.success ? "success" : "destructive"}>
                    {status.productTest?.success ? "Passed" : "Failed"}
                  </Badge>
                </div>

                {status.productTest?.product && (
                  <div className="border p-3 rounded-md mt-2 text-sm">
                    <div><span className="font-medium">Product ID:</span> {status.productTest.product.id}</div>
                    <div><span className="font-medium">Name:</span> {status.productTest.product.name}</div>
                    <div><span className="font-medium">Upvotes:</span> {status.productTest.product.upvotes}</div>
                    <div><span className="font-medium">Downvotes:</span> {status.productTest.product.downvotes}</div>
                    <div><span className="font-medium">Score:</span> {status.productTest.product.score}</div>
                  </div>
                )}

                {!status.isFixed && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>System needs fixing</AlertTitle>
                    <AlertDescription>
                      {status.error 
                        ? `Error: ${status.error}` 
                        : `The vote system functions are not working correctly. Click "Apply Fix" to repair them.`}
                    </AlertDescription>
                  </Alert>
                )}

                {status.isFixed && (
                  <Alert className="mt-4 bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-700">System is working correctly</AlertTitle>
                    <AlertDescription className="text-green-600">
                      The vote functions have the correct signatures and are working properly.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No status available</AlertTitle>
                <AlertDescription>
                  Unable to retrieve the system status. Try refreshing the page.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={checkSystemStatus} disabled={checking}>
              {checking ? 'Checking...' : 'Refresh Status'}
            </Button>
          </CardFooter>
        </Card>

        {/* Fix Application Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Apply System Fix
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </CardTitle>
            <CardDescription>
              Apply SQL fixes to correct the vote function signatures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Admin only</AlertTitle>
                <AlertDescription>
                  This operation modifies database functions and should only be performed by administrators.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label htmlFor="adminToken" className="text-sm font-medium">
                    Admin Token
                  </label>
                  <button 
                    onClick={() => setShowToken(!showToken)}
                    className="text-xs text-blue-500 hover:text-blue-700"
                  >
                    {showToken ? 'Hide' : 'Show'}
                  </button>
                </div>
                <Input
                  id="adminToken"
                  type={showToken ? 'text' : 'password'}
                  placeholder="Enter admin token"
                  value={adminToken}
                  onChange={(e) => setAdminToken(e.target.value)}
                />
              </div>

              <Button 
                onClick={applyFix} 
                disabled={loading || !adminToken || status?.isFixed}
                className="w-full"
                variant={status?.isFixed ? "outline" : "default"}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Applying Fix...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Apply Fix
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fix Results */}
      {results && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Fix Results
              {results.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </CardTitle>
            <CardDescription>
              Results from applying the vote system fix
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert variant={results.success ? "default" : "destructive"}>
                {results.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>{results.success ? 'Success' : 'Error'}</AlertTitle>
                <AlertDescription>
                  {results.message || (results.success 
                    ? 'The vote system was fixed successfully!' 
                    : 'There was an error fixing the vote system.')}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Step Results</h3>
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Step</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.results?.map((result: any, index: number) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {result.step}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Badge variant={result.success ? "success" : "destructive"}>
                              {result.success ? "Success" : "Failed"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {result.error ? (
                              <span className="text-red-500">{result.error}</span>
                            ) : result.result ? (
                              <details>
                                <summary className="cursor-pointer text-blue-500">View Result</summary>
                                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                                  {JSON.stringify(result.result, null, 2)}
                                </pre>
                              </details>
                            ) : (
                              <span className="text-green-500">Completed successfully</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 