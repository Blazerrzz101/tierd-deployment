import slugify from 'slugify'

/**
 * Product interface definition
 */
export interface Product {
  id: string
  name: string
  description?: string
  price?: number
  category?: string
  image?: string
  url_slug?: string
  brand?: string
  model?: string
  specs?: Record<string, any>
  rating?: number
  votes?: {
    upvotes: number
    downvotes: number
  }
  userVote?: number | null
  review_count?: number
  created_at?: string
  updated_at?: string
  alternativeSlugs?: string[]
}

// Mock products for local development and testing
export const mockProducts: Product[] = [
  {
    id: "12345678-1234-1234-1234-123456789012",
    name: "Samsung Odyssey G7",
    description: "32-inch WQHD gaming monitor with 240Hz refresh rate",
    url_slug: "samsung-odyssey-g7",
    category: "monitors",
    brand: "Samsung",
    model: "Odyssey G7",
    rating: 4.5,
    votes: {
      upvotes: 120,
      downvotes: 15
    }
  },
  {
    id: "87654321-4321-4321-4321-210987654321",
    name: "Logitech G Pro X Superlight",
    description: "Lightweight wireless gaming mouse",
    url_slug: "logitech-g-pro-x-superlight",
    category: "mice",
    brand: "Logitech",
    model: "G Pro X Superlight",
    rating: 4.8,
    votes: {
      upvotes: 250,
      downvotes: 20
    }
  }
]

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
 * Find a product by slug
 */
export function findProductBySlug(slug: string | null | undefined): Product | null {
  if (!slug || slug === 'undefined') {
    return null
  }
  
  // Find product by direct slug match
  let product = mockProducts.find(p => p.url_slug === slug)
  
  // If not found by direct match, try alternative slugs if available
  if (!product) {
    product = mockProducts.find(p => 
      (p as any).alternativeSlugs && 
      Array.isArray((p as any).alternativeSlugs) && 
      (p as any).alternativeSlugs.includes(slug)
    )
  }
  
  // Last resort: try to find by generated slug
  if (!product) {
    product = mockProducts.find(p => getValidProductSlug(p) === slug)
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
  
  // Get a valid slug - this will never return undefined
  const slug = getValidProductSlug(product)
  
  // Return the URL with the valid slug
  return `/products/${slug}`
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
 */
export function slugifyString(str: string): string {
  return slugify(str, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  })
} 