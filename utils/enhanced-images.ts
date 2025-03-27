/**
 * Enhanced Product Images Utility
 * 
 * Provides high-quality and additional images for products
 */

// Map product names to high-quality primary images
const enhancedImagesMap: Record<string, string> = {
  // Gaming Mice
  "Logitech G502 X Plus": "/images/enhanced/logitech-g502-x-plus.webp",
  "Razer Viper V2 Pro": "/images/enhanced/razer-viper-v2-pro.webp",
  "Finalmouse Starlight-12": "/images/enhanced/finalmouse-starlight-12.webp",
  "Zowie EC2-C": "/images/enhanced/zowie-ec2-c.webp",
  "Corsair M65 RGB Elite": "/images/enhanced/corsair-m65-rgb-elite.webp",
  "SteelSeries Prime Wireless": "/images/enhanced/steelseries-prime-wireless.webp",
  "Glorious Model O Wireless": "/images/enhanced/glorious-model-o-wireless.webp",
  "HyperX Pulsefire Haste": "/images/enhanced/hyperx-pulsefire-haste.webp",
  
  // Keyboards
  "Keychron Q1 Pro": "/images/enhanced/keychron-q1-pro.webp",
  "Ducky One 3": "/images/enhanced/ducky-one-3.webp",
  "Logitech G915 TKL": "/images/enhanced/logitech-g915-tkl.webp",
  "Razer Huntsman Mini": "/images/enhanced/razer-huntsman-mini.webp",
  "Corsair K70 RGB Pro": "/images/enhanced/corsair-k70-rgb-pro.webp",
  "SteelSeries Apex Pro TKL": "/images/enhanced/steelseries-apex-pro-tkl.webp",
  
  // Headsets
  "HyperX Cloud Alpha": "/images/enhanced/hyperx-cloud-alpha.webp",
  "SteelSeries Arctis Nova Pro": "/images/enhanced/steelseries-arctis-nova-pro.webp",
  "Logitech G Pro X Wireless": "/images/enhanced/logitech-g-pro-x-wireless.webp",
  "Razer BlackShark V2 Pro": "/images/enhanced/razer-blackshark-v2-pro.webp",
  "Corsair Virtuoso RGB Wireless": "/images/enhanced/corsair-virtuoso-rgb-wireless.webp",
  
  // Monitors
  "LG UltraGear 27GP950": "/images/enhanced/lg-ultragear-27gp950.webp",
  "Samsung Odyssey G7": "/images/enhanced/samsung-odyssey-g7.webp",
  "ASUS ROG Swift PG279QM": "/images/enhanced/asus-rog-swift-pg279qm.webp",
  "Alienware AW3423DW": "/images/enhanced/alienware-aw3423dw.webp",
  "Gigabyte M28U": "/images/enhanced/gigabyte-m28u.webp",
  
  // Controllers
  "Xbox Elite Wireless Controller Series 2": "/images/enhanced/xbox-elite-series-2.webp",
  "Sony DualSense Edge": "/images/enhanced/sony-dualsense-edge.webp",
  "SCUF Instinct Pro": "/images/enhanced/scuf-instinct-pro.webp",
  "Razer Wolverine V2 Chroma": "/images/enhanced/razer-wolverine-v2-chroma.webp",
  
  // Chairs
  "Secretlab Titan Evo 2022": "/images/enhanced/secretlab-titan-evo-2022.webp",
  "Herman Miller Embody Gaming Chair": "/images/enhanced/herman-miller-embody.webp",
  "Logitech G x Herman Miller Vantum": "/images/enhanced/logitech-herman-miller-vantum.webp",
  "Razer Iskur X": "/images/enhanced/razer-iskur-x.webp",
};

// Map product names to alternate images (multiple views/angles)
const alternateImagesMap: Record<string, string[]> = {
  "Logitech G502 X Plus": [
    "/images/enhanced/alternates/logitech-g502-x-plus-side.webp",
    "/images/enhanced/alternates/logitech-g502-x-plus-top.webp",
    "/images/enhanced/alternates/logitech-g502-x-plus-bottom.webp"
  ],
  "Razer Viper V2 Pro": [
    "/images/enhanced/alternates/razer-viper-v2-pro-side.webp",
    "/images/enhanced/alternates/razer-viper-v2-pro-bottom.webp"
  ],
  "SteelSeries Arctis Nova Pro": [
    "/images/enhanced/alternates/steelseries-arctis-nova-pro-side.webp",
    "/images/enhanced/alternates/steelseries-arctis-nova-pro-base.webp"
  ],
  "Samsung Odyssey G7": [
    "/images/enhanced/alternates/samsung-odyssey-g7-side.webp",
    "/images/enhanced/alternates/samsung-odyssey-g7-back.webp"
  ],
  "Xbox Elite Wireless Controller Series 2": [
    "/images/enhanced/alternates/xbox-elite-series-2-front.webp",
    "/images/enhanced/alternates/xbox-elite-series-2-back.webp",
    "/images/enhanced/alternates/xbox-elite-series-2-accessories.webp"
  ],
  "Secretlab Titan Evo 2022": [
    "/images/enhanced/alternates/secretlab-titan-evo-2022-side.webp",
    "/images/enhanced/alternates/secretlab-titan-evo-2022-back.webp"
  ]
};

// Fallbacks from Best Buy if our enhanced images don't exist
import { getBestBuyImage } from './affiliate-utils';

/**
 * Gets an enhanced product image for a product
 * @param productName The name of the product
 * @returns The enhanced image URL or null if not found
 */
export function getEnhancedProductImage(productName: string): string | null {
  // Try direct match with our enhanced images
  if (enhancedImagesMap[productName]) {
    return enhancedImagesMap[productName];
  }
  
  // Try fuzzy matching with our enhanced images
  const matchedKey = Object.keys(enhancedImagesMap).find(key => 
    productName.toLowerCase().includes(key.toLowerCase()) || 
    key.toLowerCase().includes(productName.toLowerCase())
  );
  
  if (matchedKey) {
    return enhancedImagesMap[matchedKey];
  }
  
  // Try Best Buy image as fallback
  return getBestBuyImage(productName);
}

/**
 * Gets alternate product images for a product
 * @param productName The name of the product
 * @returns Array of alternate image URLs or undefined if none found
 */
export function getAlternateProductImages(productName: string): string[] | undefined {
  // Try direct match
  if (alternateImagesMap[productName]) {
    return alternateImagesMap[productName];
  }
  
  // Try fuzzy matching
  const matchedKey = Object.keys(alternateImagesMap).find(key => 
    productName.toLowerCase().includes(key.toLowerCase()) || 
    key.toLowerCase().includes(productName.toLowerCase())
  );
  
  return matchedKey ? alternateImagesMap[matchedKey] : undefined;
}

/**
 * Check if a product has an enhanced image
 * @param productName The name of the product to check
 * @returns True if the product has an enhanced image
 */
export function hasEnhancedImage(productName: string): boolean {
  return !!getEnhancedProductImage(productName);
}

/**
 * Get the attribution (source) for an enhanced product image
 * @param productName The name of the product
 * @returns The source of the image (e.g., 'Best Buy', 'Manufacturer')
 */
export function getImageAttribution(productName: string): string | undefined {
  if (!productName) return undefined;
  
  // Try to find an exact match first
  if (enhancedImagesMap[productName]) {
    return 'Manufacturer';
  }
  
  // Try to find the closest match
  const closestMatch = Object.keys(enhancedImagesMap).find(key => 
    productName.toLowerCase().includes(key.toLowerCase()) || 
    key.toLowerCase().includes(productName.toLowerCase())
  );
  if (closestMatch) {
    return 'Manufacturer';
  }
  
  return undefined;
}

/**
 * Get both the main image and alternate images for a product
 * @param productName The name of the product
 * @returns Object containing main image URL and array of alternate image URLs
 */
export function getAllProductImages(productName: string): { main: string | undefined, alternates: string[] } {
  return {
    main: getEnhancedProductImage(productName),
    alternates: getAlternateProductImages(productName) || []
  };
}

/**
 * Get the total number of available images for a product (main + alternates)
 * @param productName The name of the product
 * @returns The total number of available images
 */
export function getProductImageCount(productName: string): number {
  const images = getAllProductImages(productName);
  return (images.main ? 1 : 0) + images.alternates.length;
}

/**
 * Get a list of all product names that have enhanced images
 * @returns Array of product names with enhanced images
 */
export function getProductsWithEnhancedImages(): string[] {
  return Object.keys(enhancedImagesMap);
}
