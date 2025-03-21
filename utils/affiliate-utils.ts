import slugify from 'slugify'

/**
 * Amazon affiliate link generation
 * Format: https://www.amazon.com/gp/product/[ASIN]?tag=[AFFILIATE_TAG]
 */

// Placeholder for Amazon affiliate ID - Replace with your own
const AMAZON_AFFILIATE_ID = 'tierd-20'

/**
 * Creates an Amazon affiliate link for a product
 * @param productName The name of the product
 * @param asin The Amazon ASIN if available
 * @returns Amazon affiliate link
 */
export function createAmazonAffiliateLink(productName: string, asin?: string): string {
  // If ASIN is provided, create a direct product link
  if (asin) {
    return `https://www.amazon.com/gp/product/${asin}?tag=${AMAZON_AFFILIATE_ID}&linkCode=ll1&language=en_US`
  }
  
  // Otherwise create a search link with the product name
  const searchTerm = slugify(productName, { 
    lower: true,
    strict: true,
    replacement: '+'
  })
  
  return `https://www.amazon.com/s?k=${searchTerm}&tag=${AMAZON_AFFILIATE_ID}&linkCode=ll2&language=en_US`
}

/**
 * Map of product names to Amazon ASINs for popular products
 * This allows direct linking to the correct Amazon product page
 */
export const productAsinMap: Record<string, string> = {
  // Monitors
  'LG 27GP950-B': 'B08TDBZKR6',
  'Samsung Odyssey G7': 'B088HJ4VQK',
  'ASUS ROG Swift PG32UQX': 'B09G5J9P7X',
  'Gigabyte M32UC': 'B09LVWPM3Z',
  
  // Mice
  'Logitech G Pro X Superlight': 'B087LXCTFJ',
  'Glorious Model O': 'B07MGDRBBF',
  
  // Keyboards
  'Razer Huntsman V2': 'B09FX1QFVS',
  'Corsair K70 RGB MK.2': 'B07D5S5QKF',
  
  // Headsets
  'SteelSeries Arctis Pro Wireless': 'B079YBKT3H',
  'HyperX Cloud Alpha': 'B074NBSF9N'
}

/**
 * Get the ASIN for a product
 * @param productName The name of the product
 * @returns ASIN if available, undefined otherwise
 */
export function getProductAsin(productName: string): string | undefined {
  // Check for exact match
  if (productAsinMap[productName]) {
    return productAsinMap[productName]
  }
  
  // Check for partial matches
  const matchedProduct = Object.keys(productAsinMap).find(name => 
    productName.toLowerCase().includes(name.toLowerCase())
  )
  
  return matchedProduct ? productAsinMap[matchedProduct] : undefined
}

/**
 * Best Buy image URLs
 * This emulates scraping by providing direct links to high-quality images
 */
export const bestBuyImageMap: Record<string, string> = {
  // Monitors
  'LG 27GP950-B': 'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6451/6451083_sd.jpg',
  'Samsung Odyssey G7': 'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6425/6425569_sd.jpg',
  'ASUS ROG Swift PG32UQX': 'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6464/6464474_sd.jpg',
  'Gigabyte M32UC': 'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6488/6488848_sd.jpg',
  
  // Mice
  'Logitech G Pro X Superlight': 'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6442/6442997_sd.jpg',
  'Glorious Model O': 'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6473/6473392_sd.jpg',
  
  // Keyboards
  'Razer Huntsman V2': 'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6479/6479194_sd.jpg',
  'Corsair K70 RGB MK.2': 'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6298/6298657_sd.jpg',
  
  // Headsets
  'SteelSeries Arctis Pro Wireless': 'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6219/6219770_sd.jpg',
  'HyperX Cloud Alpha': 'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/5926/5926703_sd.jpg'
}

/**
 * Get a high-quality Best Buy image URL for a product
 * @param productName The name of the product
 * @returns Image URL if available, undefined otherwise
 */
export function getBestBuyImage(productName: string): string | undefined {
  // Check for exact match
  if (bestBuyImageMap[productName]) {
    return bestBuyImageMap[productName]
  }
  
  // Check for partial matches
  const matchedProduct = Object.keys(bestBuyImageMap).find(name => 
    productName.toLowerCase().includes(name.toLowerCase())
  )
  
  return matchedProduct ? bestBuyImageMap[matchedProduct] : undefined
}

/**
 * Get both affiliate link and image in one call
 * @param productName The name of the product
 * @returns Object with affiliate link and image URL
 */
export function getProductAffiliateLinkAndImage(productName: string): {
  affiliateLink: string;
  imageUrl?: string;
} {
  const asin = getProductAsin(productName)
  const affiliateLink = createAmazonAffiliateLink(productName, asin)
  const imageUrl = getBestBuyImage(productName)
  
  return {
    affiliateLink,
    imageUrl
  }
} 