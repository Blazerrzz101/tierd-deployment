/**
 * Calculates the Levenshtein distance between two strings
 * @param a First string
 * @param b Second string
 * @returns Distance between the strings (lower is more similar)
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculates similarity between two strings based on Levenshtein distance
 * @param a First string
 * @param b Second string
 * @returns Similarity score between 0 and 1 (1 being identical)
 */
export function stringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  
  // Check for direct substring matches first (partial matches)
  if (aLower.includes(bLower) || bLower.includes(aLower)) {
    const lenRatio = Math.min(aLower.length, bLower.length) / Math.max(aLower.length, bLower.length);
    // Boost the score for substring matches
    return 0.5 + (0.5 * lenRatio);
  }
  
  // Calculate Levenshtein distance
  const distance = levenshteinDistance(aLower, bLower);
  const maxLength = Math.max(aLower.length, bLower.length);
  
  // Convert distance to similarity score (1 - normalized distance)
  return maxLength === 0 ? 1 : 1 - (distance / maxLength);
}

/**
 * Finds the closest matching product name from an array of product names
 * @param searchName The product name to search for
 * @param productNames Array of available product names
 * @param threshold Minimum similarity threshold (0-1, default 0.7)
 * @returns The closest matching product name, or undefined if no match exceeds threshold
 */
export function findClosestMatchProduct(
  searchName: string,
  productNames: string[],
  threshold = 0.7
): string | undefined {
  if (!searchName || !productNames.length) return undefined;
  
  let bestMatch: string | undefined = undefined;
  let bestScore = threshold - 0.01; // Initialize just below threshold
  
  // Handle common versioning patterns
  const normalizedSearchName = searchName
    .replace(/\s+(v|version)\s*(\d+)/i, ' $2') // Replace "v2" with "2"
    .replace(/\s+MK\.?(\d+)/i, ' MK$1')        // Normalize "MK.2" to "MK2"
    .replace(/\s+Series\s+(\d+)/i, ' $1');     // Replace "Series 2" with "2"
  
  for (const productName of productNames) {
    // Normalize the product name using the same patterns
    const normalizedProductName = productName
      .replace(/\s+(v|version)\s*(\d+)/i, ' $2')
      .replace(/\s+MK\.?(\d+)/i, ' MK$1')
      .replace(/\s+Series\s+(\d+)/i, ' $1');
    
    const similarity = stringSimilarity(normalizedSearchName, normalizedProductName);
    
    if (similarity > bestScore) {
      bestScore = similarity;
      bestMatch = productName; // Store the original product name
    }
  }
  
  return bestMatch;
}

/**
 * Finds all product names that contain the search term (case insensitive)
 * @param searchTerm The term to search for
 * @param productNames Array of product names to search within
 * @returns Array of matching product names
 */
export function findProductsContaining(searchTerm: string, productNames: string[]): string[] {
  if (!searchTerm) return [];
  const searchLower = searchTerm.toLowerCase();
  
  return productNames.filter(productName => 
    productName.toLowerCase().includes(searchLower)
  );
} 