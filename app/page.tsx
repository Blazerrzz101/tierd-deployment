"use client";

import { useEffect, useState } from 'react'
import { testDatabaseConnection, testUserProfileFetch } from '@/lib/supabase/client'
import ClientWrapper from "./components/ClientWrapper";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export default function HomePage() {
  const [diagnosticResults, setDiagnosticResults] = useState({
    dbConnection: null as boolean | null,
    userProfile: null as boolean | null,
    isLoading: true
  })

  useEffect(() => {
    async function runDiagnostics() {
      console.log('Running Supabase diagnostics...')
      
      try {
        // Test database connection
        const isConnected = await testDatabaseConnection()
        console.log('Database connection test:', isConnected ? 'PASSED' : 'FAILED')
        
        // Test user profile fetch
        const hasProfile = await testUserProfileFetch()
        console.log('User profile test:', hasProfile ? 'PASSED' : 'FAILED')

        setDiagnosticResults({
          dbConnection: isConnected,
          userProfile: hasProfile,
          isLoading: false
        })
      } catch (error) {
        console.error('Diagnostic error:', error)
        setDiagnosticResults(prev => ({
          ...prev,
          isLoading: false
        }))
      }
    }

    runDiagnostics()
  }, [])

  return (
    <div className="min-h-screen bg-black">
      {!diagnosticResults.isLoading && (
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          {/* Database Connection Status */}
          <Alert variant={diagnosticResults.dbConnection ? "default" : "destructive"}>
            {diagnosticResults.dbConnection ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              Database Connection {diagnosticResults.dbConnection ? 'Successful' : 'Failed'}
            </AlertTitle>
            <AlertDescription>
              {diagnosticResults.dbConnection
                ? 'Successfully connected to Supabase database'
                : 'Failed to connect to database. Check console for details.'}
            </AlertDescription>
          </Alert>

          {/* User Profile Status */}
          <Alert variant={diagnosticResults.userProfile ? "default" : "destructive"}>
            {diagnosticResults.userProfile ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              User Profile {diagnosticResults.userProfile ? 'Available' : 'Unavailable'}
            </AlertTitle>
            <AlertDescription>
              {diagnosticResults.userProfile
                ? 'Successfully fetched user profile'
                : 'Unable to fetch user profile. Check console for details.'}
            </AlertDescription>
          </Alert>
        </div>
      )}
      <ClientWrapper />
    </div>
  );
}

