"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function FixVotingPage() {
  const [loading, setLoading] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const applyMigration = async () => {
    try {
      setLoading(true);
      setError(null);
      setResults(null);

      const response = await fetch('/api/apply-migration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ authToken: adminToken })
      });

      const data = await response.json();
      setResults(data);

      if (!response.ok) {
        setError(data.error || 'Failed to apply migration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Fix Voting System</h1>
      <p className="text-gray-500 mb-6">
        This page allows you to apply database migrations to fix the voting system.
        This is necessary because the deployed site cannot write to the file system.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Apply Migration</CardTitle>
          <CardDescription>
            Enter an admin token to apply the migration (required for production)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              type="password"
              placeholder="Admin token (if required)"
              value={adminToken}
              onChange={e => setAdminToken(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={applyMigration} disabled={loading}>
              {loading ? 'Applying...' : 'Apply Migration'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Migration Results
              {getStatusIcon(results.success)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.results?.map((result: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{result.step}</h3>
                    {getStatusIcon(result.success)}
                  </div>
                  {result.error && (
                    <p className="text-red-500 text-sm mt-1">{result.error}</p>
                  )}
                  {result.data && (
                    <pre className="bg-gray-100 p-2 rounded text-xs mt-2 max-h-40 overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-gray-500">
              {results.success
                ? 'Migration applied successfully. The voting system should now work correctly.'
                : 'Migration failed. Please check the errors and try again.'}
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
} 