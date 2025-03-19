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

// Get or create a client ID from localStorage
export function getClientId(): string {
  if (typeof window === 'undefined') {
    // Return a placeholder for server-side rendering
    return 'server-side';
  }

  // Try to get existing client ID from localStorage
  let clientId = localStorage.getItem('clientId');

  // If no client ID exists, create and store one
  if (!clientId) {
    clientId = generateClientId();
    localStorage.setItem('clientId', clientId);
  }

  return clientId;
}

// Clear the client ID (used on sign out)
export function clearClientId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('clientId');
  }
} 