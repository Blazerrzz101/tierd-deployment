/**
 * Debug utilities for client ID issues
 */

import { getClientId, isValidClientId } from './client-id';

// Debug the client ID from all possible sources
export function debugClientId() {
  try {
    // Only run in browser
    if (typeof window === 'undefined') {
      console.log('[ClientID Debug] Running on server side');
      return { source: 'server', clientId: null, valid: false };
    }

    // Get from localStorage
    let localStorageClientId: string | null = null;
    try {
      localStorageClientId = localStorage.getItem('clientId');
      console.log('[ClientID Debug] localStorage clientId:', localStorageClientId);
    } catch (e) {
      console.log('[ClientID Debug] Error accessing localStorage:', e);
    }

    // Get from cookies
    let cookieClientId: string | null = null;
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'clientId' && value) {
          cookieClientId = value;
          console.log('[ClientID Debug] Cookie clientId:', cookieClientId);
          break;
        }
      }
    } catch (e) {
      console.log('[ClientID Debug] Error accessing cookies:', e);
    }

    // Get from utility function
    const utilityClientId = getClientId();
    console.log('[ClientID Debug] Utility function clientId:', utilityClientId);

    // Results
    const result = {
      localStorage: localStorageClientId,
      cookie: cookieClientId,
      utility: utilityClientId,
      valid: isValidClientId(utilityClientId),
      source: 'unknown' as string
    };

    // Determine source
    if (isValidClientId(utilityClientId)) {
      if (utilityClientId === localStorageClientId) {
        result.source = 'localStorage';
      } else if (utilityClientId === cookieClientId) {
        result.source = 'cookie';
      } else {
        result.source = 'generated';
      }
    }

    console.log('[ClientID Debug] Final result:', result);
    return result;
  } catch (error) {
    console.error('[ClientID Debug] Error in debugClientId:', error);
    return { error: String(error), valid: false };
  }
}

// Inject debug info into page
export function injectDebugInfo() {
  try {
    if (typeof window === 'undefined') return;
    
    const result = debugClientId();
    
    // Create debug overlay
    const debugDiv = document.createElement('div');
    debugDiv.style.position = 'fixed';
    debugDiv.style.bottom = '10px';
    debugDiv.style.right = '10px';
    debugDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
    debugDiv.style.color = '#fff';
    debugDiv.style.padding = '10px';
    debugDiv.style.borderRadius = '5px';
    debugDiv.style.fontSize = '12px';
    debugDiv.style.zIndex = '9999';
    debugDiv.style.maxWidth = '400px';
    debugDiv.style.fontFamily = 'monospace';
    
    debugDiv.innerHTML = `
      <div><strong>Client ID Debug:</strong></div>
      <div>Source: ${result.source}</div>
      <div>Valid: ${result.valid}</div>
      <div>ID: ${result.utility ? result.utility.substring(0, 8) + '...' : 'none'}</div>
    `;
    
    document.body.appendChild(debugDiv);
    
    // Add button to fix client ID
    const fixButton = document.createElement('button');
    fixButton.innerText = 'Fix Client ID';
    fixButton.style.marginTop = '5px';
    fixButton.style.padding = '5px';
    fixButton.style.backgroundColor = '#4CAF50';
    fixButton.style.border = 'none';
    fixButton.style.borderRadius = '3px';
    fixButton.style.color = 'white';
    fixButton.style.cursor = 'pointer';
    
    fixButton.onclick = () => {
      // Generate a new client ID
      const timestamp = Date.now().toString(36);
      const randomString = Math.random().toString(36).substring(2, 10);
      const newId = `${timestamp}-${randomString}`;
      
      localStorage.setItem('clientId', newId);
      
      // Also set as cookie
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      document.cookie = `clientId=${newId}; expires=${oneYearFromNow.toUTCString()}; path=/; SameSite=Lax`;
      
      // Update the debug display
      debugDiv.innerHTML = `
        <div><strong>Client ID Debug:</strong></div>
        <div>Source: fixed</div>
        <div>Valid: true</div>
        <div>ID: ${newId.substring(0, 8)}...</div>
        <div style="color: #4CAF50">Client ID fixed!</div>
      `;
      
      // Reload the page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    };
    
    debugDiv.appendChild(fixButton);
    
    return result;
  } catch (error) {
    console.error('[ClientID Debug] Error injecting debug info:', error);
  }
} 