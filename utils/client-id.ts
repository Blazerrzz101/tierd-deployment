/**
 * Utilities for managing anonymous client IDs
 */

// Generate a unique client ID for anonymous users
export function generateClientId(): string {
  // Use a combination of timestamp and random string
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomString}`;
}

// Set a cookie with the client ID (for fallback)
function setClientIdCookie(id: string): void {
  if (typeof document === 'undefined') return;
  
  try {
    // Set cookie with 1 year expiry
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    document.cookie = `clientId=${id}; expires=${oneYearFromNow.toUTCString()}; path=/; SameSite=Lax`;
    console.log('Set clientId cookie for fallback');
  } catch (error) {
    console.error('Error setting clientId cookie:', error);
  }
}

// Get client ID from cookie (fallback)
function getClientIdFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'clientId' && value) {
        return value;
      }
    }
    return null;
  } catch (error) {
    console.error('Error reading clientId from cookie:', error);
    return null;
  }
}

// Get or create a client ID from localStorage
export function getClientId(): string {
  if (typeof window === 'undefined') return 'server-side';
  
  try {
    // Try to get existing client ID from localStorage
    const storedId = localStorage.getItem('clientId');
    if (storedId && storedId !== 'undefined' && storedId !== 'null') {
      // Also set as cookie for fallback
      setClientIdCookie(storedId);
      return storedId;
    }
    
    // Check if we have a cookie as fallback
    const cookieId = getClientIdFromCookie();
    if (cookieId && cookieId !== 'undefined' && cookieId !== 'null') {
      // Restore localStorage from cookie
      try {
        localStorage.setItem('clientId', cookieId);
        console.log('Restored client ID from cookie:', cookieId);
      } catch (storageError) {
        console.error('Error restoring clientId to localStorage:', storageError);
      }
      return cookieId;
    }
    
    // Generate a new client ID
    const newId = generateClientId();
    
    try {
      localStorage.setItem('clientId', newId);
      // Also set as cookie for fallback
      setClientIdCookie(newId);
      console.log('Created new client ID:', newId);
    } catch (storageError) {
      console.error('Error storing clientId in localStorage:', storageError);
      // Return the new ID anyway even if we couldn't store it
    }
    
    return newId;
  } catch (error) {
    console.error('Error accessing localStorage for clientId:', error);
    
    // Try cookie as last resort
    const cookieId = getClientIdFromCookie();
    if (cookieId) {
      return cookieId;
    }
    
    // Last resort: generate an in-memory client ID that won't persist
    // This allows the current session to work even if localStorage is unavailable
    const fallbackId = generateClientId();
    try {
      setClientIdCookie(fallbackId);
    } catch (e) {
      // Ignore cookie errors at this point
    }
    return fallbackId;
  }
}

// Clear the client ID (used on sign out)
export function clearClientId(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('clientId');
      
      // Also clear the cookie
      if (typeof document !== 'undefined') {
        document.cookie = 'clientId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
    } catch (error) {
      console.error('Error clearing clientId:', error);
    }
  }
}

// Check if a client ID is valid
export function isValidClientId(clientId: string | null | undefined): boolean {
  if (!clientId) return false;
  if (clientId === 'server-side' || clientId === 'undefined' || clientId === 'null') return false;
  return clientId.length >= 8; // Simple length validation
}

// Ensure a valid client ID exists, creating one if needed
export function ensureClientId(): string {
  const id = getClientId();
  if (!isValidClientId(id)) {
    return generateClientId();
  }
  return id;
} 