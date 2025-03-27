import slugify from 'slugify'
import { products as allProducts } from "@/lib/data";
import { Product as ProductType } from "@/types/product";

/**
 * Product interface definition - mirrors the one from @/types/product.ts
 * Extended with additional properties for our application
 */
export interface Product extends ProductType {
  brand?: string;
  model?: string;
  alternativeSlugs?: string[];
}

// Map all products to ensure they match our interface
export const mockProducts: Product[] = allProducts.map(product => {
  // Cast the product to 'any' to avoid type errors during mapping
  const p = product as any;
  
  return {
    id: p.id,
    name: p.name,
    description: p.description || "",
    price: p.price || 0,
    category: p.category || "",
    image_url: p.imageUrl || "",
    imageUrl: p.imageUrl || "",
    url_slug: p.url_slug || "",
    specifications: p.specs || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    upvotes: p.upvotes || Math.floor((p.votes || 0) * 0.7),
    downvotes: p.downvotes || Math.floor((p.votes || 0) * 0.3),
    score: p.score || p.votes || 0,
    rank: p.rank || 0,
    rating: p.rating || 4.0,
    review_count: p.review_count || Math.floor((p.votes || 0) / 2),
    reviews: p.reviews || [],
    threads: p.threads || [],
    brand: p.brand || p.name.split(' ')[0],
    model: p.model || p.name.split(' ').slice(1).join(' ')
  };
});

/**
 * Get a product by ID or slug
 * @param idOrSlug Product ID or URL slug
 * @returns The product if found, or null if not found
 */
export async function getProductByIdOrSlug(idOrSlug: string) {
  if (!idOrSlug) return null;
  
  try {
    // First try to find in mock products
    let product = mockProducts.find(p => 
      p.id === idOrSlug || p.url_slug === idOrSlug
    );
    
    if (product) {
      return product;
    }
    
    // If not found in mock data, try to fetch from API
    const response = await fetch(`/api/products/product?id=${idOrSlug}`);
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.product) {
        return data.product;
      }
    }
    
    // Try by slug if id didn't work
    const slugResponse = await fetch(`/api/products/product?slug=${idOrSlug}`);
    if (slugResponse.ok) {
      const data = await slugResponse.json();
      if (data.success && data.product) {
        return data.product;
      }
    }
    
    // Not found
    return null;
  } catch (error) {
    console.error(`Error fetching product with id/slug ${idOrSlug}:`, error);
    return null;
  }
}

/**
 * Get a proper URL slug for a product
 * @param product Product object or product ID
 * @returns The URL slug if available, or the product ID as fallback
 */
export function getProductUrlSlug(product: any): string {
  if (!product) return '';
  
  // If it's already a string, assume it's an ID or slug
  if (typeof product === 'string') {
    return product;
  }
  
  // If it has a url_slug property, use that
  if (product.url_slug) {
    return product.url_slug;
  }
  
  // Otherwise use the ID as fallback
  return product.id || '';
}

/**
 * Find a product by ID
 */
export function findProductById(productId: string) {
  if (!productId) return null;
  return mockProducts.find(product => product.id === productId) || null;
}

/**
 * Find a product by slug with robust fallbacks
 */
export function findProductBySlug(slug: string | null | undefined): Product | null {
  if (!slug || slug === 'undefined') {
    return null
  }
  
  // 1. Find product by direct slug match
  let product = mockProducts.find(p => p.url_slug === slug)
  
  // 2. If not found by direct match, try case-insensitive match
  if (!product) {
    product = mockProducts.find(p => 
      p.url_slug && p.url_slug.toLowerCase() === slug.toLowerCase()
    )
  }
  
  // 3. Try alternative slugs if available
  if (!product) {
    product = mockProducts.find(p => 
      (p as any).alternativeSlugs && 
      Array.isArray((p as any).alternativeSlugs) && 
      (p as any).alternativeSlugs.some((altSlug: string) => 
        altSlug.toLowerCase() === slug.toLowerCase()
      )
    )
  }
  
  // 4. Try matching with a generated slug
  if (!product) {
    product = mockProducts.find(p => getValidProductSlug(p) === slug)
  }
  
  // 5. Try a normalized version of the slug (with improved slugify)
  if (!product) {
    const normalizedSlug = slugifyString(slug)
    product = mockProducts.find(p => 
      slugifyString(p.name) === normalizedSlug || 
      getValidProductSlug(p) === normalizedSlug
    )
  }
  
  // 6. Try by product ID as last resort
  if (!product) {
    product = mockProducts.find(p => p.id === slug)
  }
  
  return product
}

/**
 * Safely creates a valid product URL from a product object
 * This is the preferred way to create product URLs
 */
export function createProductUrl(product: Partial<Product> | null | undefined): string {
  if (!product) {
    console.warn("createProductUrl: No product provided")
    return "/products"
  }
  
  // For all products, use the dynamic route with a valid slug
  const slug = getValidProductSlug(product);
  return `/products/${slug}`;
}

/**
 * Creates a valid product slug from a product object
 * This will never return undefined, ensuring URLs are always valid
 */
export function getValidProductSlug(product: Partial<Product> | null | undefined): string {
  // Case 1: Valid url_slug already exists
  if (product?.url_slug && product.url_slug !== 'undefined') {
    return product.url_slug
  }
  
  // Case 2: Generate from name
  if (product?.name) {
    return slugify(product.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    })
  }
  
  // Case 3: Generate from ID
  if (product?.id) {
    return `product-${product.id.substring(0, 8)}`
  }
  
  // Fallback for complete safety
  return "unknown-product"
}

/**
 * Safely access product data with proper error checking
 */
export function safeGetProductProperty(product: any, property: string, defaultValue: any = null): any {
  if (!product || typeof product !== 'object') return defaultValue;
  
  return product[property] !== undefined ? product[property] : defaultValue;
}

/**
 * Validate if a product object has all required fields
 */
export function isValidProduct(product: any): boolean {
  if (!product || typeof product !== 'object') return false;
  
  // Check for required properties
  const requiredProps = ['id', 'name', 'category'];
  return requiredProps.every(prop => 
    product[prop] !== undefined && 
    product[prop] !== null && 
    product[prop] !== '');
}

/**
 * Safely formats product names for display
 */
export function formatProductName(product?: Partial<Product> | null): string {
  if (!product) return "Unknown Product"
  
  if (product.name) {
    return product.name
  }
  
  if (product.brand && product.model) {
    return `${product.brand} ${product.model}`
  }
  
  return "Unknown Product"
}

/**
 * Validates if a string is a valid product slug
 */
export function isValidProductSlug(slug?: string | null): boolean {
  if (!slug) return false
  if (slug === 'undefined') return false
  if (slug.includes('undefined')) return false
  
  // Basic validation: at least 3 chars, no spaces, only URL-safe chars
  return slug.length >= 3 && 
    !slug.includes(' ') && 
    /^[a-z0-9-]+$/i.test(slug)
}

/**
 * Returns a clean slug from a string (name, title, etc.)
 * Handles special characters and edge cases
 */
export function slugifyString(str: string): string {
  if (!str || typeof str !== 'string') {
    return 'unknown';
  }
  
  // Replace spaces and special characters
  return slugify(str, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@#$%^&*=]/g,
    replacement: '-',
    trim: true
  });
}

/**
 * Search for products by search term, with optional category filter
 */
export function getProductsBySearchTerm(
  query: string, 
  category?: string | null, 
  limit: number = 10
): any[] {
  // Normalize the search query
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery || normalizedQuery.length < 2) {
    return [];
  }
  
  // First, try to find products with exact name match
  const exactMatches = allProducts.filter(product => 
    product.name.toLowerCase().includes(normalizedQuery) &&
    (!category || product.category === category)
  );
  
  // Then, find products with description match
  const descriptionMatches = allProducts.filter(product =>
    product.description?.toLowerCase().includes(normalizedQuery) &&
    (!category || product.category === category) &&
    !exactMatches.some(p => p.id === product.id) // Exclude exact matches
  );
  
  // Combine results, prioritizing exact matches
  const results = [...exactMatches, ...descriptionMatches].slice(0, limit);
  
  // Enhance with additional metadata for search results display
  return results.map(product => {
    // Find where the match occurs in the name for highlighting
    const nameIndex = product.name.toLowerCase().indexOf(normalizedQuery);
    
    return {
      ...product,
      highlight: nameIndex >= 0 ? {
        start: nameIndex,
        end: nameIndex + normalizedQuery.length
      } : undefined
    };
  });
}

/**
 * Creates a URL-safe slug from a product name and ID
 * Use this when setting up new products or fixing missing slugs
 */
export function generateSafeSlug(name: string, id: string): string {
  if (!name || name === 'undefined') {
    return `product-${id.substring(0, 8)}`;
  }
  
  // Use slugify to normalize the name
  return slugify(name, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });
}

/**
 * Get a product by slug
 * @param slug Product URL slug
 * @param productList Optional product list to search in (defaults to mockProducts)
 * @returns The product if found, or null if not found
 */
export function getProductBySlug(slug: string, productList: Product[] = mockProducts): Product | null {
  if (!slug || slug === 'undefined') return null;
  
  // First try direct slug match
  let product = productList.find(p => p.url_slug === slug);
  
  // Try case-insensitive match
  if (!product) {
    product = productList.find(p => 
      p.url_slug && p.url_slug.toLowerCase() === slug.toLowerCase()
    );
  }
  
  // Try matching with the generated slug
  if (!product) {
    product = productList.find(p => getValidProductSlug(p) === slug);
  }
  
  // Try by product ID
  if (!product) {
    product = productList.find(p => p.id === slug);
  }
  
  return product || null;
}

/**
 * Fuzzy match a product by slug or search terms
 * @param query The search query or slug to match
 * @param productList Optional product list to search in (defaults to mockProducts)
 * @param limit Maximum number of matches to return
 * @returns Array of matching products
 */
export function fuzzyMatchProduct(query: string, productList: Product[] = mockProducts, limit: number = 5): Product[] {
  if (!query || query === 'undefined') return [];
  
  // Normalize query
  const normalizedQuery = query.toLowerCase().replace(/-/g, ' ').trim();
  const queryTerms = normalizedQuery.split(' ').filter(term => term.length > 2);
  
  // Score products based on match quality
  const scoredProducts = productList.map(product => {
    let score = 0;
    
    // Check name matches
    const normalizedName = product.name.toLowerCase();
    if (normalizedName.includes(normalizedQuery)) {
      score += 10;
    }
    
    // Check brand/model matches
    const brand = product.brand?.toLowerCase() || '';
    const model = product.model?.toLowerCase() || '';
    
    if (brand && normalizedQuery.includes(brand)) {
      score += 5;
    }
    
    if (model && normalizedQuery.includes(model)) {
      score += 5;
    }
    
    // Check term by term
    queryTerms.forEach(term => {
      if (normalizedName.includes(term)) {
        score += 2;
      }
      if (brand && brand.includes(term)) {
        score += 1;
      }
      if (model && model.includes(term)) {
        score += 1;
      }
      if (product.category && product.category.toLowerCase().includes(term)) {
        score += 1;
      }
    });
    
    return { product, score };
  });
  
  // Filter products with at least some match and sort by score
  return scoredProducts
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.product);
}

/**
 * For legacy IDs, creates a URL to the legacy redirect handler.
 * This function should be used when you suspect you have a legacy product ID
 * that needs special handling.
 */
export function createLegacyProductUrl(productId: string): string {
  if (!productId) {
    return "/products";
  }
  
  return `/products/legacy/${productId}`;
}

/**
 * Determines if a slug is likely a legacy ID instead of a proper slug.
 * Legacy IDs typically don't contain dashes and are shorter.
 */
export function isLikelyLegacyId(slug: string): boolean {
  return !slug.includes('-') || slug.length < 10;
} 