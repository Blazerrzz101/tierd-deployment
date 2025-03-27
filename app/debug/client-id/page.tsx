"use client";

import { useEffect, useState } from 'react';
import { getClientId, isValidClientId, generateClientId } from '@/utils/client-id';

export default function ClientIDDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Debug the client ID
  useEffect(() => {
    try {
      // Get from localStorage
      let localStorageClientId: string | null = null;
      try {
        localStorageClientId = localStorage.getItem('clientId');
      } catch (e) {
        console.log('Error accessing localStorage:', e);
      }

      // Get from cookies
      let cookieClientId: string | null = null;
      try {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'clientId' && value) {
            cookieClientId = value;
            break;
          }
        }
      } catch (e) {
        console.log('Error accessing cookies:', e);
      }

      // Get from utility function
      const utilityClientId = getClientId();

      // Results
      setDebugInfo({
        localStorage: localStorageClientId,
        cookie: cookieClientId,
        utility: utilityClientId,
        valid: isValidClientId(utilityClientId),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setDebugInfo({ error: String(error) });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fix client ID issues
  const fixClientId = () => {
    try {
      // Generate a new client ID
      const newId = generateClientId();
      
      // Set in localStorage
      try {
        localStorage.setItem('clientId', newId);
      } catch (e) {
        console.error('Error setting localStorage:', e);
      }
      
      // Set as cookie
      try {
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        document.cookie = `clientId=${newId}; expires=${oneYearFromNow.toUTCString()}; path=/; SameSite=Lax`;
      } catch (e) {
        console.error('Error setting cookie:', e);
      }
      
      // Update debug info
      setDebugInfo(prev => ({
        ...prev,
        localStorage: newId,
        cookie: newId,
        utility: newId,
        valid: true,
        fixed: true,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error fixing client ID:', error);
      setDebugInfo(prev => ({
        ...prev,
        fixError: String(error)
      }));
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Client ID Debug</h1>
      
      {loading ? (
        <div className="bg-slate-800 rounded-lg p-6 animate-pulse">
          <p>Loading client ID information...</p>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Client ID Information</h2>
          
          {debugInfo.error ? (
            <div className="bg-red-900/50 p-4 rounded-md mb-4">
              <p className="text-red-300">Error: {debugInfo.error}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-700/50 p-4 rounded-md">
                  <h3 className="font-medium mb-2">LocalStorage</h3>
                  <div className="font-mono text-sm break-all bg-slate-900/50 p-2 rounded">
                    {debugInfo.localStorage || 'Not found'}
                  </div>
                </div>
                
                <div className="bg-slate-700/50 p-4 rounded-md">
                  <h3 className="font-medium mb-2">Cookie</h3>
                  <div className="font-mono text-sm break-all bg-slate-900/50 p-2 rounded">
                    {debugInfo.cookie || 'Not found'}
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-700/50 p-4 rounded-md mb-6">
                <h3 className="font-medium mb-2">Utility Function Result</h3>
                <div className="font-mono text-sm break-all bg-slate-900/50 p-2 rounded mb-2">
                  {debugInfo.utility || 'Not found'}
                </div>
                <div className="flex items-center mt-2">
                  <span className="mr-2">Valid:</span>
                  {debugInfo.valid ? (
                    <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs">Yes</span>
                  ) : (
                    <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs">No</span>
                  )}
                </div>
              </div>
              
              {debugInfo.fixed && (
                <div className="bg-green-900/30 text-green-300 p-4 rounded-md mb-6">
                  <p className="font-medium">Client ID has been fixed!</p>
                  <p className="text-sm mt-1">New ID has been set in both localStorage and cookies.</p>
                </div>
              )}
              
              {!debugInfo.valid && (
                <button
                  onClick={fixClientId}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Fix Client ID
                </button>
              )}
              
              {debugInfo.valid && !debugInfo.fixed && (
                <div className="bg-green-900/30 text-green-300 p-4 rounded-md">
                  <p>✅ Client ID is valid and working correctly!</p>
                </div>
              )}
              
              <div className="mt-6 text-xs text-slate-400">
                <p>Timestamp: {debugInfo.timestamp}</p>
              </div>
            </>
          )}
        </div>
      )}
      
      <div className="mt-8 bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Testing Vote API</h2>
        <p className="mb-4">You can test if the Client ID is working with the voting API:</p>
        <div className="flex space-x-4">
          <button
            onClick={() => window.open('/api/vote?productId=test-product', '_blank')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Test Vote Status API
          </button>
          
          <button
            onClick={() => {
              fetch('/api/vote', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  productId: 'test-product',
                  voteType: 1,
                }),
              })
                .then(res => res.json())
                .then(data => {
                  alert(JSON.stringify(data, null, 2));
                })
                .catch(err => {
                  alert('Error: ' + err);
                });
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Test Vote Submit API
          </button>
        </div>
      </div>
      
      <div className="mt-8 bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Instructions</h2>
        <p className="mb-4">If you're experiencing "Client ID is required" errors when voting:</p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Check if your client ID is valid above</li>
          <li>If it's not valid, click the "Fix Client ID" button</li>
          <li>After fixing, try voting again on a product page</li>
          <li>If issues persist, try clearing your browser cache and cookies</li>
          <li>You can always return to this page at <code className="bg-slate-900 px-1 py-0.5 rounded">/debug/client-id</code></li>
        </ol>
      </div>
    </div>
  );
} 