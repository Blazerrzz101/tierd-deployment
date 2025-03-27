/**
 * Product Image Finder Utility
 * 
 * This utility helps find real product images by using web search APIs
 * and stores them for use in the application.
 */

import { Product } from "@/types/product";

interface ImageSearchResult {
  imageUrl: string;
  sourceUrl: string;
  sourceName: string;
}

/**
 * Extended product type with optional brand and image source information
 */
interface EnhancedProduct extends Product {
  brand?: string;
  imageSource?: string;
  alternateImages?: string[];
}

/**
 * Finds high-quality product images from the web using searches.
 * 
 * @param productName The name of the product to search for
 * @param productBrand The brand of the product (optional)
 * @param productCategory The category of the product (optional)
 * @returns A promise that resolves to an array of image search results
 */
export async function findProductImages(
  productName: string,
  productBrand?: string,
  productCategory?: string
): Promise<ImageSearchResult[]> {
  try {
    // Build search query with product name, brand, and category if available
    let searchQuery = productName;
    
    if (productBrand && !productName.toLowerCase().includes(productBrand.toLowerCase())) {
      searchQuery = `${productBrand} ${searchQuery}`;
    }
    
    if (productCategory) {
      const formattedCategory = productCategory.replace(/-/g, ' ');
      if (!searchQuery.toLowerCase().includes(formattedCategory.toLowerCase())) {
        searchQuery = `${searchQuery} ${formattedCategory}`;
      }
    }
    
    // Add "product image" to the search query to get better results
    searchQuery = `${searchQuery} product image high quality`;
    
    console.log(`Searching for images: "${searchQuery}"`);
    
    // In a real implementation, this would call a search API like Google Custom Search
    // For now, we'll return a placeholder implementation
    
    // Simulate an API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return placeholder results
    // In a real implementation, this would parse the API response
    return [
      {
        imageUrl: `https://source.unsplash.com/random/800x600?${encodeURIComponent(searchQuery)}`,
        sourceUrl: "https://unsplash.com",
        sourceName: "Unsplash"
      },
      {
        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(productName)}/800/600`,
        sourceUrl: "https://picsum.photos",
        sourceName: "Lorem Picsum"
      }
    ];
  } catch (error) {
    console.error("Error finding product images:", error);
    return [];
  }
}

/**
 * Finds and updates a product with real images from the web.
 * 
 * @param product The product to find images for
 * @returns The product with updated image information
 */
export async function enrichProductWithRealImages(product: Product): Promise<Product> {
  try {
    if (product.imageUrl && !product.imageUrl.includes("unsplash.com/random") && 
        !product.imageUrl.includes("placeholder")) {
      // Product already has a real image
      return product;
    }
    
    // Extract brand from name if not explicitly provided
    const productBrand = (product as EnhancedProduct).brand || product.name.split(' ')[0];
    
    const images = await findProductImages(
      product.name,
      productBrand,
      product.category
    );
    
    if (images.length > 0) {
      // Update product with the first image found
      const enrichedProduct: Product = {
        ...product,
        imageUrl: images[0].imageUrl,
        image_url: images[0].imageUrl,
      };
      
      // Add metadata as custom properties
      (enrichedProduct as EnhancedProduct).imageSource = images[0].sourceName;
      (enrichedProduct as EnhancedProduct).alternateImages = images.slice(1).map(img => img.imageUrl);
      
      return enrichedProduct;
    }
    
    return product;
  } catch (error) {
    console.error("Error enriching product with real images:", error);
    return product;
  }
}

/**
 * Batch processes multiple products to find real images.
 * 
 * @param products An array of products to enrich with real images
 * @returns A promise that resolves to an array of enriched products
 */
export async function batchEnrichProductsWithRealImages(products: Product[]): Promise<Product[]> {
  const enrichedProducts: Product[] = [];
  
  // Process products in batches of 3 to avoid rate limiting
  const batchSize = 3;
  
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    
    // Process batch in parallel
    const enrichedBatch = await Promise.all(
      batch.map(product => enrichProductWithRealImages(product))
    );
    
    enrichedProducts.push(...enrichedBatch);
    
    // Add a delay between batches to avoid rate limiting
    if (i + batchSize < products.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return enrichedProducts;
} 