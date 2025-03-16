// Client ID utilities
// This file centralizes client ID logic to prevent circular dependencies

// Generate a unique client ID for anonymous users
export const generateClientId = (): string => {
  return `${Math.random().toString(36).substring(2)}_${Date.now()}`;
};

// Get the client ID from localStorage or create a new one
export const getClientId = (): string => {
  if (typeof window === 'undefined') return generateClientId(); // Return a new ID in SSR context
  
  try {
    let clientId = localStorage.getItem('tierd_client_id');
    if (!clientId) {
      clientId = generateClientId();
      localStorage.setItem('tierd_client_id', clientId);
    }
    return clientId;
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return generateClientId(); // Fallback to a temporary ID
  }
};

// Clear the client ID (used when signing out)
export const clearClientId = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('tierd_client_id');
  } catch (error) {
    console.error('Error clearing client ID:', error);
  }
}; 