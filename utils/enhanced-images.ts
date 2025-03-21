/**
 * Enhanced Product Images Utility
 * 
 * This file provides high-quality product images from various sources to ensure
 * consistent, professional product visuals throughout the application.
 * 
 * Image sources include:
 * - Official manufacturer websites
 * - Unsplash (royalty-free)
 * - Pexels (royalty-free)
 * - Product shots with transparent backgrounds
 */

// Import the actual slugify function from npm package
import slugify from 'slugify';

// Default placeholder image if nothing else is available
const DEFAULT_PLACEHOLDER = "https://placehold.co/400x400/1a1a1a/ff4b26?text=No+Image";

// Image aspect ratio is approximately 1:1 (square) for product cards

/**
 * Map of product categories to default images in case a specific product image is not found
 */
export const categoryDefaultImages: Record<string, string> = {
  "monitors": "https://images.unsplash.com/photo-1545665277-5937489579f2?q=80&w=2070&auto=format&fit=crop",
  "keyboards": "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=2080&auto=format&fit=crop",
  "mice": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=2065&auto=format&fit=crop",
  "headsets": "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=1974&auto=format&fit=crop",
  "gaming": "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
  "laptops": "https://images.unsplash.com/photo-1611078489935-0cb964de46d6?q=80&w=1974&auto=format&fit=crop",
  "processors": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?q=80&w=1974&auto=format&fit=crop",
  "graphics-cards": "https://images.unsplash.com/photo-1591405351990-4726e331f141?q=80&w=2070&auto=format&fit=crop",
  "storage": "https://images.unsplash.com/photo-1600346019001-8d56d1b51d59?q=80&w=2080&auto=format&fit=crop",
};

// Category-specific placeholder images (alternative style)
const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  "keyboards": "https://images.unsplash.com/photo-1631126619959-5e2625bcd041?w=800&h=600&fit=crop",
  "mice": "https://images.unsplash.com/photo-1626906722163-bd4c03cb3b9b?w=800&h=600&fit=crop",
  "monitors": "https://images.unsplash.com/photo-1596443513356-238b937efcef?w=800&h=600&fit=crop",
  "headsets": "https://images.unsplash.com/photo-1618329340733-ab49d9a5763c?w=800&h=600&fit=crop",
  "default": "https://images.unsplash.com/photo-1519619091416-f5d7e5200702?w=800&h=600&fit=crop"
};

/**
 * High-quality product images mapped by product name
 */
export const enhancedProductImages: Record<string, string> = {
  // Monitors
  "LG 27GP950-B": "https://m.media-amazon.com/images/I/81hZ1scO+KL._AC_SL1500_.jpg",
  "Samsung Odyssey G7": "https://images.samsung.com/is/image/samsung/p6pim/uk/lc32g75tqsrxxu/gallery/uk-odyssey-g7-lc32g75tqsrxxu-531337785?$720_576_PNG$",
  "ASUS ROG Swift PG32UQX": "https://m.media-amazon.com/images/I/816oimwRuYL._AC_SL1500_.jpg",
  "Gigabyte M32UC": "https://m.media-amazon.com/images/I/71xDn5aRiRL._AC_SL1500_.jpg",
  "Dell Alienware AW3423DW": "https://m.media-amazon.com/images/I/71I4zIqtjnL._AC_SL1500_.jpg",
  "LG UltraGear 27GN950-B": "https://m.media-amazon.com/images/I/816bDeGBtAL._AC_SL1500_.jpg",
  "BenQ EX2780Q": "https://m.media-amazon.com/images/I/81tjLksKixL._AC_SL1500_.jpg",
  "MSI Optix MAG274QRF-QD": "https://m.media-amazon.com/images/I/81Vw0qD-3VL._AC_SL1500_.jpg",
  "Acer Predator XB273K": "https://m.media-amazon.com/images/I/71Biz3JYxiL._AC_SL1500_.jpg",
  "ViewSonic Elite XG270QG": "https://images.viewsonic.com/products/elite/XG270QG/20190904/XG270QG_F01_gray.png",
  "LG 27GP950": "https://www.lg.com/us/images/monitors/md08000431/gallery/27GP950-B-D-01.jpg",
  
  // Keyboards
  "Razer Huntsman V2": "https://m.media-amazon.com/images/I/81-D9eqMxzL._AC_SL1500_.jpg",
  "Corsair K70 RGB MK.2": "https://m.media-amazon.com/images/I/71VL4S5ySoL._AC_SL1500_.jpg",
  "SteelSeries Apex Pro": "https://m.media-amazon.com/images/I/81L9+3aY46L._AC_SL1500_.jpg",
  "Logitech G915 Lightspeed": "https://m.media-amazon.com/images/I/71nlBJyxZ8L._AC_SL1500_.jpg",
  "Das Keyboard 4 Professional": "https://m.media-amazon.com/images/I/71wfI9TUdAL._AC_SL1500_.jpg",
  "Keychron K2": "https://m.media-amazon.com/images/I/712JqA8qdGL._AC_SL1500_.jpg",
  "Ducky One 3": "https://mechanicalkeyboards.com/shop/images/products/large_DKON2108ST-USPDWWT1_2.jpg",
  "HyperX Alloy Origins Core": "https://m.media-amazon.com/images/I/71m9CJhv+9L._AC_SL1500_.jpg",
  "GMMK Pro": "https://cdn.shopify.com/s/files/1/0275/3649/0561/products/GLP_005_ISO_TopDown_v001_1024x1024.png",
  "HHKB Professional Hybrid": "https://m.media-amazon.com/images/I/61B-Ux1yfyL._AC_SL1500_.jpg",
  "Corsair K70 RGB": "https://www.corsair.com/medias/sys_master/images/images/h61/h09/10176438427678/CH-9109010-NA/Gallery/K70_RGB_MK2_01/-CH-9109010-NA-Gallery-K70-RGB-MK2-01.png_1200Wx1200H",
  
  // Mice
  "Logitech G Pro X Superlight": "https://m.media-amazon.com/images/I/610OUfOLRtL._AC_SL1500_.jpg",
  "Glorious Model O": "https://cdn.shopify.com/s/files/1/0549/2681/products/glorious_gaming_mouse_model_o_matte_black_1_1_e0ccbfe7-f2e1-4c78-9da9-ccf7aa8b3d68.png",
  "Razer Viper Ultimate": "https://m.media-amazon.com/images/I/7123pzOI1BL._AC_SL1500_.jpg",
  "Zowie EC2": "https://m.media-amazon.com/images/I/71mpO-SDcsL._AC_SL1500_.jpg",
  "SteelSeries Aerox 3 Wireless": "https://m.media-amazon.com/images/I/71wnK0d37rL._AC_SL1500_.jpg",
  "Logitech G502 Hero": "https://m.media-amazon.com/images/I/61mpMH5TzkL._AC_SL1500_.jpg",
  "Razer DeathAdder V2": "https://m.media-amazon.com/images/I/61doJ9AKCPL._AC_SL1500_.jpg",
  "Endgame Gear XM1r": "https://m.media-amazon.com/images/I/715wiZiT6IL._AC_SL1500_.jpg",
  "Corsair Sabre RGB Pro": "https://m.media-amazon.com/images/I/61ze1EKB+AL._AC_SL1500_.jpg",
  "Pulsar Xlite Wireless": "https://m.media-amazon.com/images/I/71Lxzm3WCXL._AC_SL1500_.jpg",
  "SteelSeries Prime": "https://media.steelseriescdn.com/thumbs/catalog/items/62553/5add656241f74198b422eea5a1cc4501.png.500x400_q100_crop-fit_optimize.png",
  
  // Headsets
  "SteelSeries Arctis Pro Wireless": "https://m.media-amazon.com/images/I/812gg-ySvVL._AC_SL1500_.jpg",
  "HyperX Cloud Alpha": "https://m.media-amazon.com/images/I/719gSteBH8L._AC_SL1500_.jpg",
  "Logitech G Pro X": "https://m.media-amazon.com/images/I/51j7VCgT+uL._AC_SL1000_.jpg",
  "Astro A50 Wireless": "https://m.media-amazon.com/images/I/71Qp4Qd5elL._AC_SL1500_.jpg",
  "Beyerdynamic DT 990 Pro": "https://m.media-amazon.com/images/I/71o9VF4h8xL._AC_SL1500_.jpg",
  "Sennheiser HD 560S": "https://m.media-amazon.com/images/I/61DI+vRIseL._AC_SL1500_.jpg",
  "Razer BlackShark V2 Pro": "https://m.media-amazon.com/images/I/81lJ4aBK0uL._AC_SL1500_.jpg",
  "Corsair Virtuoso RGB Wireless": "https://m.media-amazon.com/images/I/71IoOvTgIML._AC_SL1500_.jpg",
  "Drop + Sennheiser PC38X": "https://m.media-amazon.com/images/I/71E-Xk+BC+L._AC_SL1500_.jpg",
  "EPOS H6PRO": "https://m.media-amazon.com/images/I/61M1UOCeGnL._AC_SL1280_.jpg",
  "SteelSeries Arctis Pro": "https://media.steelseriescdn.com/thumbs/catalogue/products/00950-arctis-pro-wireless/4a27a53c06d64f0a9e02e43b2ed7b578.png.500x400_q100_crop-fit_optimize.png",
  "Razer BlackShark V2": "https://assets3.razerzone.com/EL36SGpA0hB5R0fHGrSPHnPCvKg=/1500x1000/https%3A%2F%2Fhybrismediaprod.blob.core.windows.net%2Fsys-master-phoenix-images-container%2Fhbe%2Fh02%2F9426041651230%2Fblackshark-v2-pro-white-500x500.png"
};

// Premium manufacturer-provided images with transparent backgrounds
export const premiumProductImages: Record<string, string> = {
  // Keyboards
  "Razer Huntsman V2 Premium": "https://assets3.razerzone.com/W99BkQoO3W9xXYzpXykclXXFAng=/1500x1000/https%3A%2F%2Fhybrismediaprod.blob.core.windows.net%2Fsys-master-phoenix-images-container%2Fha9%2Fh24%2F9425972674590%2Fhuntsman-v2-3-500x500.png",
  "Logitech G Pro X Premium": "https://resource.logitechg.com/w_1000,c_limit,q_auto,f_auto,dpr_auto/d_transparent.gif/content/dam/gaming/en/products/pro-x-keyboard/pro-x-keyboard-gallery-1.png",
  
  // Mice
  "Logitech G Pro X Superlight Premium": "https://resource.logitechg.com/w_1000,c_limit,q_auto,f_auto,dpr_auto/d_transparent.gif/content/dam/gaming/en/products/pro-x-superlight/pro-x-superlight-black-gallery-1.png",
  "Razer Viper Ultimate Premium": "https://assets3.razerzone.com/BSJKK9uwSIRoqAvkBqMQrVZqX2g=/1500x1000/https%3A%2F%2Fhybrismediaprod.blob.core.windows.net%2Fsys-master-phoenix-images-container%2Fh1b%2Fh83%2F9426052628510%2Fviper-v2-pro-black-500x500.png",
  
  // Monitors
  "Samsung Odyssey G7 Premium": "https://image-us.samsung.com/SamsungUS/home/computing/monitors/gaming-monitors/pdp/c27g75tqsn/gallery/Odyssey_G7_Front_Black_Gallery_01.jpg",
  "ASUS ROG Swift PG32UQX Premium": "https://dlcdnwebimgs.asus.com/gain/8bc54297-1aa0-4bb1-b1f8-62666760d3ca/"
};

/**
 * Alternate product images for different angles/views of the same product
 */
export const alternativeProductImages: Record<string, string[]> = {
  "LG 27GP950-B": [
    "https://m.media-amazon.com/images/I/81hZ1scO+KL._AC_SL1500_.jpg",
    "https://m.media-amazon.com/images/I/71GZXY1+bVL._AC_SL1500_.jpg",
    "https://m.media-amazon.com/images/I/71rOXwV+XJL._AC_SL1500_.jpg"
  ],
  "Samsung Odyssey G7": [
    "https://images.samsung.com/is/image/samsung/p6pim/uk/lc32g75tqsrxxu/gallery/uk-odyssey-g7-lc32g75tqsrxxu-531337785?$720_576_PNG$",
    "https://images.samsung.com/is/image/samsung/p6pim/uk/lc32g75tqsrxxu/gallery/uk-odyssey-g7-lc32g75tqsrxxu-531337784?$720_576_PNG$",
    "https://images.samsung.com/is/image/samsung/p6pim/uk/lc32g75tqsrxxu/gallery/uk-odyssey-g7-lc32g75tqsrxxu-531337787?$720_576_PNG$",
    // Additional angles from manufacturer site
    "https://image-us.samsung.com/SamsungUS/home/computing/monitors/gaming-monitors/pdp/c27g75tqsn/gallery/Odyssey_G7_Front_Black_Gallery_01.jpg",
    "https://image-us.samsung.com/SamsungUS/home/computing/monitors/gaming-monitors/pdp/c27g75tqsn/gallery/Odyssey_G7_Side_Black_Gallery_02.jpg",
    "https://image-us.samsung.com/SamsungUS/home/computing/monitors/gaming-monitors/pdp/c27g75tqsn/gallery/Odyssey_G7_Rear_Black_Gallery_03.jpg"
  ],
  "Logitech G Pro X Superlight": [
    "https://m.media-amazon.com/images/I/610OUfOLRtL._AC_SL1500_.jpg",
    "https://m.media-amazon.com/images/I/71xNjrzGZmL._AC_SL1500_.jpg",
    "https://m.media-amazon.com/images/I/71d7rfSl0wL._AC_SL1500_.jpg",
    // Additional angles from manufacturer site
    "https://resource.logitechg.com/w_1000,c_limit,q_auto,f_auto,dpr_auto/d_transparent.gif/content/dam/gaming/en/products/pro-x-superlight/pro-x-superlight-black-gallery-1.png",
    "https://resource.logitechg.com/w_1000,c_limit,q_auto,f_auto,dpr_auto/d_transparent.gif/content/dam/gaming/en/products/pro-x-superlight/pro-x-superlight-black-gallery-2.png",
    "https://resource.logitechg.com/w_1000,c_limit,q_auto,f_auto,dpr_auto/d_transparent.gif/content/dam/gaming/en/products/pro-x-superlight/pro-x-superlight-black-gallery-3.png"
  ]
};

/**
 * Returns a high-quality image URL for a product
 * @param productName The name of the product
 * @param category The product category (optional)
 * @returns A high-quality image URL
 */
export function getEnhancedProductImage(productName: string, category?: string): string | undefined {
  // If no product name, return undefined
  if (!productName) return undefined
  
  // 1. Try to find an exact match in enhanced images
  if (enhancedProductImages[productName]) {
    return enhancedProductImages[productName];
  }
  
  // 2. Try to find a partial match in enhanced images
  const enhancedMatch = Object.keys(enhancedProductImages).find(name => 
    productName.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(productName.toLowerCase())
  );
  
  if (enhancedMatch) {
    return enhancedProductImages[enhancedMatch];
  }
  
  // 3. Try premium manufacturer images with transparent backgrounds
  const premiumMatch = Object.keys(premiumProductImages).find(name => 
    productName.toLowerCase().includes(name.toLowerCase().replace(' premium', '')) ||
    name.toLowerCase().replace(' premium', '').includes(productName.toLowerCase())
  );
  
  if (premiumMatch) {
    return premiumProductImages[premiumMatch];
  }
  
  // 4. For keyboard switches, use a special placeholder
  if (productName.toLowerCase().includes('switch') && 
      (productName.toLowerCase().includes('cherry') || 
       productName.toLowerCase().includes('gateron'))) {
    return "https://images.unsplash.com/photo-1589578228447-e1a4e481c6c8?w=800&h=600&fit=crop"
  }
  
  // 5. Check if product name contains a brand and use a brand-specific fallback
  const brands = ["logitech", "razer", "corsair", "steelseries", "hyperx", "glorious", "asus", "samsung", "lg"]
  for (const brand of brands) {
    if (productName.toLowerCase().includes(brand)) {
      if (brand === "logitech") {
        return "https://resource.logitechg.com/w_1000,c_limit,q_auto,f_auto,dpr_auto/d_transparent.gif/content/dam/gaming/en/products/pro-wireless-gaming-mouse/pro-wireless-carbon-gallery-1.png"
      }
      if (brand === "razer") {
        return "https://assets3.razerzone.com/3OdQkwaXQTVJqGZO59MElY7dTNI=/1500x1000/https%3A%2F%2Fhybrismediaprod.blob.core.windows.net%2Fsys-master-phoenix-images-container%2Fh78%2Fhde%2F9080092549150%2Frazer-basilisk-v3-500x500.png"
      }
    }
  }
  
  // 6. If category provided, use category default
  if (category) {
    const slugCategory = slugify(category.toLowerCase());
    
    // Try categoryDefaultImages first
    if (categoryDefaultImages[slugCategory]) {
      return categoryDefaultImages[slugCategory];
    }
    
    // Then try CATEGORY_PLACEHOLDERS
    if (CATEGORY_PLACEHOLDERS[slugCategory]) {
      return CATEGORY_PLACEHOLDERS[slugCategory];
    }
    
    // Try to partially match category
    const matchedCategory = Object.keys(categoryDefaultImages).find(cat => 
      slugCategory.includes(cat) || cat.includes(slugCategory)
    );
    
    if (matchedCategory) {
      return categoryDefaultImages[matchedCategory];
    }
  }
  
  // 7. Get a random category image as fallback
  const categories = Object.keys(categoryDefaultImages);
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  return categoryDefaultImages[randomCategory];
}

/**
 * Get alternate images for a product
 * @param productName The name of the product
 * @returns Array of image URLs or undefined if no alternates exist
 */
export function getAlternateProductImages(productName: string): string[] | undefined {
  // If no product name, return undefined
  if (!productName) return undefined
  
  // 1. Check for exact match in alternative product images
  if (alternativeProductImages[productName]) {
    return alternativeProductImages[productName];
  }
  
  // 2. Check for partial matches
  const matchedProduct = Object.keys(alternativeProductImages).find(name => 
    productName.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(productName.toLowerCase())
  );
  
  if (matchedProduct) {
    return alternativeProductImages[matchedProduct];
  }
  
  // 3. If no alternate views found, create an array with the primary image
  const primaryImage = getEnhancedProductImage(productName);
  if (primaryImage) {
    return [primaryImage];
  }
  
  return undefined;
} 