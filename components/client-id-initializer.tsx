"use client"

import { useEffect } from 'react'
import { ensureClientId, isValidClientId } from '@/utils/client-id'

/**
 * Component that initializes client ID on page load
 * This is added to the layout.tsx file to ensure client ID is available
 * before any components that need it are rendered
 */
export default function ClientIDInitializer() {
  useEffect(() => {
    try {
      // Check for client ID as early as possible in the page lifecycle
      const id = ensureClientId();
      
      if (!isValidClientId(id)) {
        console.warn('Invalid client ID detected on page load, attempting to fix');
        const newId = ensureClientId();
        console.log('Generated new client ID:', newId);
      } else {
        console.log('Client ID validated on page load:', id);
      }
      
      // Print diagnostic information to console
      if (typeof window !== 'undefined') {
        console.log('localStorage access test:', {
          available: typeof localStorage !== 'undefined',
          clientId: localStorage.getItem('clientId'),
          itemCount: Object.keys(localStorage).length
        });
      }
    } catch (error) {
      console.error('Error initializing client ID:', error);
    }
  }, []);

  // This component doesn't render anything
  return null;
} 