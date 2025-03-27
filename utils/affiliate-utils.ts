import slugify from 'slugify'

/**
 * Affiliate Links Utility
 * 
 * Provides functions to generate affiliate links for products
 * to monetize the application through affiliate marketing programs.
 */

// Example Amazon Affiliate ID - replace with your actual ID
const AMAZON_AFFILIATE_ID = 'tiered-20';

// Map product names to Amazon Standard Identification Numbers (ASINs)
const amazonAsinMap: Record<string, string> = {
  // Mice
  "Logitech G502 X Plus": "B0B11RX36F",
  "Razer Viper V2 Pro": "B09VCR969L",
  "Glorious Model O": "B084351MV3",
  "SteelSeries Prime Wireless": "B0948L83R3",
  "Logitech G Pro X Superlight": "B087LXCTFJ",
  "Corsair M65 RGB Elite": "B07KM7F9YH",
  "Finalmouse Starlight-12": "B097KB5PB8",
  "Zowie EC2-C": "B09MCH97BG",
  "Razer DeathAdder V3 Pro": "B0B4WW4T9T",
  "Logitech G303 Shroud Edition": "B09BFQH2GV",
  "Endgame Gear XM1r": "B08NYGDQVR",
  "Pulsar Xlite V2": "B09QKRPGK9",
  "HyperX Pulsefire Haste": "B08KJ2F13Z",
  "Roccat Kone XP": "B09RK1S4MF",
  "Glorious Model D": "B084352MSB",
  "Razer Basilisk V3": "B09C13PZX6",
  
  // Keyboards
  "Razer Huntsman Mini": "B08B3FXYXY",
  "Logitech G915 TKL": "B085RLZ1C5",
  "Ducky One 3": "B09H3K57L1",
  "Keychron Q1": "B095SDSX73",
  "SteelSeries Apex Pro": "B07SVJJCP3",
  "Corsair K70 RGB MK.2": "B07D5S5QKF",
  "GMMK Pro": "B09667Z4T8",
  "Royal Kludge RK84": "B08K919V5Q",
  "Drop ALT": "B07SX1L2WS",
  "Wooting 60HE": "B09ZTTBP1G",
  "Drop CTRL Mechanical Keyboard": "B08FMSMLST",
  "Corsair K100 RGB": "B08HMLNZ8J",
  "Mountain Everest Max": "B092LT797B",
  "Keychron K8 Pro": "B09MG8J94P",
  "EPOMAKER TH80": "B09GZQB8LT",
  
  // Monitors
  "LG 27GP950-B": "B09B2VZ2RR",
  "Samsung Odyssey G7": "B088HJ4VQK",
  "Alienware AW3423DW": "B09LQGX5HZ",
  "ASUS ROG Swift PG279QM": "B08T6JZTH2",
  "Dell S2721DGF": "B00P0EQD1Q",
  "MSI MPG ARTYMIS 343CQR": "B08TKSNL9W",
  "Gigabyte M28U": "B08LLF9NS1",
  "BenQ ZOWIE XL2546K": "B08J9G5K64",
  "AOC 24G2": "B083GRVFXN",
  "Eve Spectrum 4K 144Hz": "B09J8TZQKD",
  "Acer Predator X28": "B09CTDKPWB",
  "Gigabyte M32U": "B083N4X6JM",
  "ASUS ROG Swift 360Hz PG259QN": "B08GL5TJQT",
  "ViewSonic XG271QG": "B095J171CL",
  
  // Headsets
  "SteelSeries Arctis Nova Pro": "B09ZQP1M8P",
  "SteelSeries Arctis 7+": "B09GLMRJRR",
  "HyperX Cloud Alpha": "B074NBSF9N",
  "Logitech G Pro X": "B07PHML2XB",
  "Logitech G Pro X Wireless": "B087QR15ZN",
  "Razer BlackShark V2 Pro": "B09567Q949",
  "Corsair HS70 Pro": "B07Y984FLC",
  "Sennheiser GSP 370": "B07SRTDK2J",
  "Astro A50": "B07R4RB8R9",
  "Beyerdynamic MMX 300": "B06WGVJ9GY",
  "EPOS H3PRO Hybrid": "B09HZ3ZX8K",
  "ASUS ROG Delta S": "B08PDLRZ7D",
  "Sennheiser PC38X": "B08HMWZBXH",
  "Audio-Technica ATH-G1": "B07TLX61W7",
  
  // Controllers
  "Xbox Elite Wireless Controller Series 2": "B07SFKTLZM",
  "PlayStation DualSense Edge": "B0BMTJ89HQ",
  "Sony DualSense Edge": "B0BMTJ89HQ",
  "SCUF Instinct Pro": "B098QF3NRQ",
  "Razer Wolverine V2 Chroma": "B09FL67N5Q",
  "8BitDo Ultimate Controller": "B0BJ9TZTRJ",
  "Xbox Wireless Controller": "B08DF248LD",
  "PlayStation DualSense": "B08H99BPJN",
  "Nintendo Switch Pro Controller": "B01NAWKYZ0",
  "Thrustmaster eSwap X Pro": "B08KRV141T",
  "PowerA Enhanced Wireless Controller": "B08F6H413Q",
  
  // Chairs
  "Secretlab Titan Evo": "B094G4SSBX",
  "Secretlab Titan Evo 2022": "B094G4SSBX",
  "Herman Miller Embody Gaming Chair": "B08L1FFKPX",
  "Herman Miller x Logitech G Embody": "B08L1FFKPX",
  "Corsair TC100 Relaxed": "B09XXG7J6L",
  "Noblechairs HERO": "B07FLHK953",
  "Razer Iskur": "B08FV48F7Q",
  "AKRacing Masters Series Premium": "B06XWDL5C4",
  "Autonomous ErgoChair Pro": "B08JW8S3VH",
  "GT Racing GT099": "B07DNDDNW4",
  "DXRacer Formula Series": "B006N1IKDI",
};

// Map product names to high-quality Best Buy product images
const bestBuyImagesMap: Record<string, string> = {
  "Logitech G502 X Plus": "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6510/6510937_sd.jpg",
  "Razer Viper V2 Pro": "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6505/6505608_sd.jpg",
  "Logitech G Pro X Superlight": "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6442/6442893_sd.jpg",
  "SteelSeries Arctis Nova Pro": "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6502/6502591_sd.jpg",
  "SteelSeries Arctis 7+": "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6464/6464418_sd.jpg",
  "Samsung Odyssey G7": "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6425/6425569_sd.jpg",
  "Xbox Elite Wireless Controller Series 2": "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6352/6352703_sd.jpg",
  "Sony DualSense Edge": "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6519/6519456_sd.jpg",
  "Secretlab Titan Evo": "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6492/6492511_sd.jpg",
  "HyperX Cloud Alpha": "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6100/6100104_sd.jpg",
  "Razer BlackShark V2 Pro": "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6425/6425880_sd.jpg",
  "Razer Huntsman Mini": "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6425/6425359_sd.jpg",
  "Logitech G Pro X Wireless": "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6422/6422339_sd.jpg",
  "Corsair K100 RGB": "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6436/6436203_sd.jpg",
  "LG 27GP950-B": "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6451/6451081_sd.jpg",
  "Acer Predator X28": "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6483/6483980_sd.jpg",
  "Gigabyte M32U": "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6475/6475388_sd.jpg",
  "Ducky One 3": "https://mechanicalkeyboards.com/shop/images/products/large_4743_Ducky_One3_DayBreak_TKL.jpg",
  "Keychron Q1": "https://cdn.shopify.com/s/files/1/0059/0630/1017/products/Keychron-Q1-QMK-Custom-Mechanical-Keyboard-Full-Version-Navy-Blue_768x.jpg",
  "Razer DeathAdder V3 Pro": "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6517/6517839_sd.jpg",
  "Logitech G303 Shroud Edition": "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6483/6483976_sd.jpg",
  "HyperX Pulsefire Haste": "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6436/6436219_sd.jpg",
  "Xbox Wireless Controller": "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6430/6430655_sd.jpg",
  "PlayStation DualSense": "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6430/6430163_sd.jpg",
  "Nintendo Switch Pro Controller": "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/5748/5748618_sd.jpg",
};

/**
 * Gets the Amazon ASIN (product ID) for a product name
 * @param productName The name of the product
 * @returns The Amazon ASIN or undefined if not found
 */
export function getAmazonAsin(productName: string): string | undefined {
  // Direct match
  if (amazonAsinMap[productName]) {
    return amazonAsinMap[productName];
  }

  // Try fuzzy matching
  const matchedKey = Object.keys(amazonAsinMap).find(key => 
    productName.toLowerCase().includes(key.toLowerCase()) || 
    key.toLowerCase().includes(productName.toLowerCase())
  );

  return matchedKey ? amazonAsinMap[matchedKey] : undefined;
}

/**
 * Creates an Amazon affiliate link for a given product
 * @param productName The name of the product to create a link for
 * @returns The Amazon affiliate link or empty string if no mapping exists
 */
export function createAmazonAffiliateLink(productName: string): string {
  const asin = getAmazonAsin(productName);
  
  if (!asin) {
    return '';
  }
  
  return `https://www.amazon.com/dp/${asin}?tag=${AMAZON_AFFILIATE_ID}`;
}

/**
 * Gets affiliate link and possibly enhanced image for a product
 * @param productName The name of the product
 * @returns Object with affiliateLink and imageUrl (if available)
 */
export function getProductAffiliateLinkAndImage(productName: string): { 
  affiliateLink: string | null; 
  imageUrl: string | null;
} {
  // Get the affiliate link
  const affiliateLink = createAmazonAffiliateLink(productName);
  
  // Get the Best Buy image if available
  const imageUrl = getBestBuyImage(productName);
  
  return {
    affiliateLink: affiliateLink || null,
    imageUrl
  };
}

/**
 * Gets a high-quality product image from Best Buy if available
 * @param productName The name of the product
 * @returns The image URL or null if not found
 */
export function getBestBuyImage(productName: string): string | null {
  // Direct match
  if (bestBuyImagesMap[productName]) {
    return bestBuyImagesMap[productName];
  }

  // Try fuzzy matching
  const matchedKey = Object.keys(bestBuyImagesMap).find(key => 
    productName.toLowerCase().includes(key.toLowerCase()) || 
    key.toLowerCase().includes(productName.toLowerCase())
  );

  return matchedKey ? bestBuyImagesMap[matchedKey] : null;
} 