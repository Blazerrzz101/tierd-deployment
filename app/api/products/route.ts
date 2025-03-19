import { NextRequest, NextResponse } from "next/server";
import { getVoteState } from '../../lib/vote-utils';
import { getClientId } from '@/utils/client-id';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface MockProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  url_slug: string;
  image_url: string;
  specifications: Record<string, string>;
  created_at: string;
  updated_at: string;
  rating: number;
  review_count: number;
  reviews: any[];
  threads: any[];
  upvotes?: number;
  downvotes?: number;
  userVote?: number | null;
  score?: number;
  alternativeSlugs?: string[];
}

// Helper function to ensure valid slugs
function generateSafeSlug(name: string, id: string): string {
  if (!name) return `product-${id}`;
  
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}

// Mock product data for testing
export const mockProducts: MockProduct[] = [
  {
    id: "j1k2l3m4-n5o6-p7q8-r9s0-t1u2v3w4x5y6",
    name: "LG 27GP950-B",
    description: "27-inch UltraGear™ UHD Nano IPS 1ms 144Hz HDR600 Monitor with G-SYNC® Compatible",
    category: "monitors",
    price: 899.99,
    url_slug: "lg-27gp950",
    image_url: "/images/products/lg-27gp950.jpg",
    specifications: {
      "Panel Type": "Nano IPS",
      "Resolution": "3840 x 2160 (UHD 4K)",
      "Refresh Rate": "144Hz",
      "Response Time": "1ms GtG",
      "HDR": "VESA DisplayHDR 600",
      "Connectivity": "2x HDMI 2.1, 1x DisplayPort 1.4, 1x USB-C",
      "Model Variants": "27GP950-B (Black)"
    },
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-04-15T00:00:00Z",
    rating: 4.8,
    review_count: 147,
    reviews: [],
    threads: [],
    // Add alternate slugs for better URL compatibility
    alternativeSlugs: ["lg-27gp950-b"]
  },
  {
    id: "c8d9e0f1-2a3b-4c5d-6e7f-8g9h0i1j2k3l",
    name: "Samsung Odyssey G7",
    description: "32-inch QLED 1000R Curved Gaming Monitor with 240Hz refresh rate and 1ms response time",
    category: "monitors",
    price: 749.99,
    url_slug: "samsung-odyssey-g7",
    image_url: "/images/products/samsung-g7.jpg",
    specifications: {
      "Panel Type": "QLED VA",
      "Resolution": "2560 x 1440 (QHD)",
      "Refresh Rate": "240Hz",
      "Response Time": "1ms MPRT",
      "HDR": "VESA DisplayHDR 600",
      "Connectivity": "2x HDMI 2.0, 1x DisplayPort 1.4"
    },
    created_at: "2023-02-10T00:00:00Z",
    updated_at: "2023-05-20T00:00:00Z",
    rating: 4.6,
    review_count: 129,
    reviews: [],
    threads: []
  },
  {
    id: "9dd2bfe2-6eef-40de-ae12-c35ff1975914",
    name: "Logitech G Pro X Superlight",
    description: "Ultra-lightweight wireless gaming mouse for esports professionals",
    category: "mice",
    price: 149.99,
    url_slug: "logitech-g-pro-x-superlight",
    image_url: "/images/products/g-pro-superlight.jpg",
    specifications: {
      "Sensor": "HERO 25K",
      "DPI Range": "100-25,600",
      "Weight": "63g",
      "Battery Life": "Up to 70 hours",
      "Connectivity": "Wireless (LIGHTSPEED)",
      "Buttons": "5 Programmable Buttons"
    },
    created_at: "2023-03-15T00:00:00Z",
    updated_at: "2023-06-18T00:00:00Z",
    rating: 4.9,
    review_count: 218,
    reviews: [],
    threads: []
  },
  {
    id: "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
    name: "Razer Huntsman V2",
    description: "Optical gaming keyboard with 8000Hz polling rate and sound dampening foam",
    category: "keyboards",
    price: 199.99,
    url_slug: "razer-huntsman-v2",
    image_url: "/images/products/huntsman-v2.jpg",
    specifications: {
      "Switch Type": "Razer Gen-2 Optical Switch",
      "Keycaps": "Doubleshot PBT",
      "Polling Rate": "8000Hz",
      "Lighting": "Razer Chroma RGB",
      "Wrist Rest": "Detachable Leatherette",
      "Media Controls": "Digital Dial and Keys"
    },
    created_at: "2023-02-20T00:00:00Z",
    updated_at: "2023-07-01T00:00:00Z",
    rating: 4.7,
    review_count: 156,
    reviews: [],
    threads: []
  },
  {
    id: "q1w2e3r4-t5y6-u7i8-o9p0-a1s2d3f4g5h6",
    name: "SteelSeries Arctis Pro Wireless",
    description: "Premium high-fidelity gaming audio system with dual-wireless technology",
    category: "headsets",
    price: 329.99,
    url_slug: "steelseries-arctis-pro-wireless",
    image_url: "/images/products/arctis-pro-wireless.jpg",
    specifications: {
      "Driver": "40mm Neodymium",
      "Frequency Response": "10-40,000 Hz",
      "Microphone": "ClearCast Bidirectional",
      "Battery Life": "20+ hours (with 2 swappable batteries)",
      "Connectivity": "2.4GHz Wireless & Bluetooth",
      "Surround Sound": "DTS Headphone:X v2.0"
    },
    created_at: "2023-01-25T00:00:00Z",
    updated_at: "2023-06-12T00:00:00Z",
    rating: 4.5,
    review_count: 173,
    reviews: [],
    threads: []
  },
  {
    id: "z1x2c3v4-b5n6-m7k8-j9h0-g1f2d3s4a5",
    name: "ASUS ROG Swift PG32UQX",
    description: "32-inch 4K HDR mini-LED gaming monitor with 144Hz refresh rate",
    category: "monitors",
    price: 2999.99,
    url_slug: "asus-rog-swift-pg32uqx",
    image_url: "/images/products/pg32uqx.jpg",
    specifications: {
      "Panel Type": "IPS with Mini-LED Backlight",
      "Resolution": "3840 x 2160 (UHD 4K)",
      "Refresh Rate": "144Hz",
      "Response Time": "4ms (GtG)",
      "HDR": "VESA DisplayHDR 1400",
      "Connectivity": "1x DisplayPort 1.4, 3x HDMI 2.0, USB Hub"
    },
    created_at: "2023-04-05T00:00:00Z",
    updated_at: "2023-08-10T00:00:00Z",
    rating: 4.7,
    review_count: 94,
    reviews: [],
    threads: []
  },
  {
    id: "p9o8i7u6-y5t4-r3e2-w1q0-z9x8c7v6b5",
    name: "Glorious Model O",
    description: "Ultra-lightweight gaming mouse with honeycomb shell design",
    category: "mice",
    price: 79.99,
    url_slug: "glorious-model-o",
    image_url: "/images/products/model-o.jpg",
    specifications: {
      "Sensor": "Pixart PMW 3360",
      "DPI Range": "400-12,000",
      "Weight": "67g",
      "Cable": "Ascended Cord (Ultra-flexible)",
      "Connectivity": "Wired",
      "Buttons": "6 Programmable Buttons"
    },
    created_at: "2023-03-20T00:00:00Z",
    updated_at: "2023-07-15T00:00:00Z",
    rating: 4.6,
    review_count: 182,
    reviews: [],
    threads: []
  },
  {
    id: "n4m3b2v1-c8x7z6-p5o4i3-u2y1t0-r9e8w7q6",
    name: "Corsair K70 RGB MK.2",
    description: "Mechanical gaming keyboard with Cherry MX switches and per-key RGB lighting",
    category: "keyboards",
    price: 159.99,
    url_slug: "corsair-k70-rgb-mk2",
    image_url: "/images/products/k70-rgb-mk2.jpg",
    specifications: {
      "Switch Type": "Cherry MX (Red, Blue, Brown, Speed, Silent)",
      "Keycaps": "ABS",
      "Polling Rate": "1000Hz",
      "Lighting": "Per-Key RGB",
      "Wrist Rest": "Detachable Soft-Touch",
      "Media Controls": "Dedicated Buttons and Volume Roller"
    },
    created_at: "2023-02-15T00:00:00Z",
    updated_at: "2023-06-28T00:00:00Z",
    rating: 4.5,
    review_count: 210,
    reviews: [],
    threads: []
  },
  {
    id: "l5k4j3h2-g1f0d9-s8a7p6-o5i4u3-y2t1r0e9",
    name: "HyperX Cloud Alpha",
    description: "Gaming headset with dual chamber drivers for less distortion and more clarity",
    category: "headsets",
    price: 99.99,
    url_slug: "hyperx-cloud-alpha",
    image_url: "/images/products/cloud-alpha.jpg",
    specifications: {
      "Driver": "50mm with dual chamber",
      "Frequency Response": "13-27,000 Hz",
      "Microphone": "Detachable Noise-cancelling",
      "Connection": "3.5mm",
      "Compatibility": "PC, PS4, Xbox One, Nintendo Switch, Mobile",
      "Features": "Aluminum Frame, Memory Foam Ear Cushions"
    },
    created_at: "2023-01-18T00:00:00Z",
    updated_at: "2023-05-30T00:00:00Z",
    rating: 4.6,
    review_count: 228,
    reviews: [],
    threads: []
  },
  {
    id: "w9q8e7r6-t5y4u3-i2o1p0-a9s8d7-f6g5h4j3",
    name: "Gigabyte M32UC",
    description: "32-inch 4K curved gaming monitor with 144Hz refresh rate and 1ms response time",
    category: "monitors",
    price: 699.99,
    url_slug: "gigabyte-m32uc",
    image_url: "/images/products/m32uc.jpg",
    specifications: {
      "Panel Type": "VA",
      "Resolution": "3840 x 2160 (UHD 4K)",
      "Refresh Rate": "144Hz",
      "Response Time": "1ms MPRT",
      "HDR": "VESA DisplayHDR 400",
      "Connectivity": "2x HDMI 2.1, 1x DisplayPort 1.4, USB Hub"
    },
    created_at: "2023-04-10T00:00:00Z",
    updated_at: "2023-07-25T00:00:00Z",
    rating: 4.4,
    review_count: 112,
    reviews: [],
    threads: []
  }
];

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/products called');
    
    const clientId = getClientId();
    
    // Add URL slug validation - make sure all products have valid slugs
    const productsWithValidSlugs = mockProducts.map(product => {
      // If product doesn't have a valid slug, generate one from the name
      if (!product.url_slug || product.url_slug.includes('undefined')) {
        return {
          ...product,
          url_slug: generateSafeSlug(product.name, product.id)
        };
      }
      return product;
    });
    
    // Get category filter from query params
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    // Filter products by category if specified
    let filteredProducts = category && category !== 'all'
      ? productsWithValidSlugs.filter(p => p.category === category)
      : productsWithValidSlugs;
      
    // Get vote state to add vote counts
    try {
      const voteState = await getVoteState();
      
      // Enhance products with vote data
      filteredProducts = filteredProducts.map(product => {
        const voteCounts = voteState.voteCounts[product.id] || { upvotes: 0, downvotes: 0 };
        const voteKey = `${product.id}:${clientId}`;
        const userVote = voteState.votes[voteKey] || null;
        const score = voteCounts.upvotes - voteCounts.downvotes;
        
        return {
          ...product,
          upvotes: voteCounts.upvotes,
          downvotes: voteCounts.downvotes,
          userVote,
          score
        };
      });
      
      // Sort by score (descending)
      filteredProducts.sort((a, b) => (b.score || 0) - (a.score || 0));
      
    } catch (error) {
      console.error('Error enhancing products with vote data:', error);
      // Continue with the original products if vote data can't be retrieved
    }
    
    return NextResponse.json({
      success: true,
      products: filteredProducts
    });
    
  } catch (error) {
    console.error('Error in GET /api/products:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch products',
      products: []
    }, { status: 500 });
  }
} 