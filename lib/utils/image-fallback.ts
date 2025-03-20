/**
 * Image Fallback Utilities
 * 
 * This helper provides fallback functionality for image handling,
 * ensuring users always see something rather than broken images.
 */

// Base64 encoded transparent placeholder
export const TRANSPARENT_PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// Generic product placeholder
export const PRODUCT_PLACEHOLDER = '/placeholders/product.svg';

// User avatar placeholder
export const USER_AVATAR_PLACEHOLDER = '/placeholders/user.svg';

// Category specific placeholders
export const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  mice: '/placeholders/mouse.svg',
  keyboards: '/placeholders/keyboard.svg',
  monitors: '/placeholders/monitor.svg',
  headsets: '/placeholders/headset.svg',
  default: '/placeholders/product.svg'
};

/**
 * Get a placeholder image based on product category
 */
export const getProductPlaceholder = (category?: string): string => {
  if (!category) return PRODUCT_PLACEHOLDER;
  return CATEGORY_PLACEHOLDERS[category.toLowerCase()] || PRODUCT_PLACEHOLDER;
};

/**
 * Handle image error by replacing with a suitable placeholder
 */
export const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  category?: string
): void => {
  const img = event.currentTarget;
  img.src = category ? getProductPlaceholder(category) : PRODUCT_PLACEHOLDER;
  img.onerror = null; // Prevent infinite error loop
};

/**
 * Get a safe image URL that falls back to a placeholder if the URL is invalid
 */
export const getSafeImageUrl = (
  url?: string | null,
  fallback: string = PRODUCT_PLACEHOLDER
): string => {
  if (!url) return fallback;
  
  // Check if URL is already a data URL or absolute URL
  if (url.startsWith('data:') || url.startsWith('http')) {
    return url;
  }
  
  // Check if URL is a relative path
  if (url.startsWith('/')) {
    return url;
  }
  
  return fallback;
}; 