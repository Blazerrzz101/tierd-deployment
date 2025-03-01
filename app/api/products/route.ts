import { NextRequest, NextResponse } from "next/server";
import { getVoteState } from '../../lib/vote-utils';

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
}

// Mock product data for testing
export const mockProducts: MockProduct[] = [
  {
    id: "j1k2l3m4-n5o6-p7q8-r9s0-t1u2v3w4x5y6",
    name: "ASUS ROG Swift PG279QM",
    description: "27-inch gaming monitor with 240Hz refresh rate and G-SYNC",
    category: "monitors",
    price: 849.99,
    url_slug: "asus-rog-swift-pg279qm",
    image_url: "/images/products/placeholder-monitor.svg",
    specifications: {
      "Screen Size": "27 inches",
      "Resolution": "2560 x 1440",
      "Refresh Rate": "240Hz",
      "Response Time": "1ms",
      "Panel Type": "IPS",
      "HDR": "HDR400",
      "G-SYNC": "Yes"
    },
    created_at: "2023-01-15T12:00:00Z",
    updated_at: "2023-06-20T15:30:00Z",
    rating: 4.8,
    review_count: 156,
    reviews: [],
    threads: []
  },
  {
    id: "c8d9e0f1-2a3b-4c5d-6e7f-8g9h0i1j2k3l",
    name: "Razer DeathAdder V2",
    description: "Ergonomic gaming mouse with optical switches",
    category: "mice",
    price: 69.99,
    url_slug: "razer-deathadder-v2",
    image_url: "/images/products/placeholder-mouse.svg",
    specifications: {
      "Sensor": "Focus+ 20K DPI Optical",
      "Switches": "Optical",
      "Buttons": "8",
      "Connection": "Wired",
      "Weight": "82g"
    },
    created_at: "2023-03-05T14:30:00Z",
    updated_at: "2023-08-12T10:20:00Z",
    rating: 4.7,
    review_count: 189,
    reviews: [],
    threads: []
  },
  {
    id: "9dd2bfe2-6eef-40de-ae12-c35ff1975914",
    name: "Logitech G502 HERO",
    description: "High-performance gaming mouse with HERO sensor",
    category: "mice",
    price: 79.99,
    url_slug: "logitech-g502-hero",
    image_url: "/images/products/placeholder-mouse.svg",
    specifications: {
      "Sensor": "HERO 25K",
      "Switches": "Mechanical",
      "Buttons": "11",
      "Connection": "Wired",
      "Weight": "121g (adjustable)"
    },
    created_at: "2023-02-10T09:15:00Z",
    updated_at: "2023-07-05T11:45:00Z",
    rating: 4.5,
    review_count: 256,
    reviews: [],
    threads: []
  },
  {
    id: "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
    name: "Logitech G Pro X Superlight",
    description: "Ultra-lightweight wireless gaming mouse for esports professionals",
    category: "mice",
    price: 149.99,
    url_slug: "logitech-g-pro-x-superlight",
    image_url: "/images/products/placeholder-mouse.svg",
    specifications: {
      "Sensor": "HERO 25K",
      "Switches": "Omron",
      "Buttons": "5",
      "Connection": "Wireless",
      "Weight": "63g"
    },
    created_at: "2023-04-12T08:45:00Z",
    updated_at: "2023-09-03T16:20:00Z",
    rating: 4.9,
    review_count: 320,
    reviews: [],
    threads: []
  },
  {
    id: "q1w2e3r4-t5y6-u7i8-o9p0-a1s2d3f4g5h6",
    name: "SteelSeries Apex Pro",
    description: "Mechanical gaming keyboard with adjustable actuation",
    category: "keyboards",
    price: 199.99,
    url_slug: "steelseries-apex-pro",
    image_url: "/images/products/placeholder-keyboard.svg",
    specifications: {
      "Switches": "OmniPoint Adjustable",
      "Backlight": "RGB Per-Key",
      "Layout": "Full-size",
      "Wrist Rest": "Magnetic",
      "Media Controls": "OLED Smart Display",
      "Connection": "Wired"
    },
    created_at: "2023-02-18T11:30:00Z",
    updated_at: "2023-08-25T09:15:00Z",
    rating: 4.6,
    review_count: 284,
    reviews: [],
    threads: []
  },
  {
    id: "z1x2c3v4-b5n6-m7k8-j9h0-g1f2d3s4a5",
    name: "Ducky One 3",
    description: "Premium mechanical keyboard with hot-swappable switches",
    category: "keyboards",
    price: 119.99,
    url_slug: "ducky-one-3",
    image_url: "/images/products/placeholder-keyboard.svg",
    specifications: {
      "Switches": "Cherry MX",
      "Backlight": "RGB",
      "Layout": "TKL",
      "Keycaps": "PBT Double-shot",
      "Features": "Hot-swappable",
      "Connection": "USB-C Detachable"
    },
    created_at: "2023-01-25T14:20:00Z",
    updated_at: "2023-07-18T13:40:00Z",
    rating: 4.7,
    review_count: 215,
    reviews: [],
    threads: []
  },
  {
    id: "p9o8i7u6-y5t4-r3e2-w1q0-z9x8c7v6b5",
    name: "Samsung Odyssey G7",
    description: "32-inch curved gaming monitor with 240Hz refresh rate",
    category: "monitors",
    price: 699.99,
    url_slug: "samsung-odyssey-g7",
    image_url: "/images/products/placeholder-monitor.svg",
    specifications: {
      "Screen Size": "32 inches",
      "Resolution": "2560 x 1440",
      "Refresh Rate": "240Hz",
      "Response Time": "1ms",
      "Panel Type": "VA",
      "Curvature": "1000R",
      "HDR": "HDR600"
    },
    created_at: "2023-03-20T10:15:00Z",
    updated_at: "2023-08-30T15:10:00Z",
    rating: 4.6,
    review_count: 178,
    reviews: [],
    threads: []
  },
  {
    id: "n4m3b2v1-c8x7z6-p5o4i3-u2y1t0-r9e8w7q6",
    name: "HyperX Cloud Alpha",
    description: "Gaming headset with dual chamber drivers for superior sound",
    category: "headsets",
    price: 99.99,
    url_slug: "hyperx-cloud-alpha",
    image_url: "/images/products/placeholder-headset.svg",
    specifications: {
      "Drivers": "50mm Dual Chamber",
      "Frequency Response": "13Hz-27kHz",
      "Connection": "3.5mm",
      "Microphone": "Detachable",
      "Weight": "336g",
      "Features": "Memory foam earpads"
    },
    created_at: "2023-02-08T16:45:00Z",
    updated_at: "2023-07-22T11:30:00Z",
    rating: 4.8,
    review_count: 345,
    reviews: [],
    threads: []
  },
  {
    id: "l5k4j3h2-g1f0d9-s8a7p6-o5i4u3-y2t1r0e9",
    name: "SteelSeries Arctis Pro",
    description: "High-fidelity gaming headset with dedicated DAC",
    category: "headsets",
    price: 249.99,
    url_slug: "steelseries-arctis-pro",
    image_url: "/images/products/placeholder-headset.svg",
    specifications: {
      "Drivers": "40mm Neodymium",
      "Frequency Response": "10Hz-40kHz",
      "Connection": "USB/Optical",
      "Microphone": "Retractable ClearCast",
      "Weight": "426g",
      "Features": "GameDAC, RGB lighting"
    },
    created_at: "2023-01-30T09:20:00Z",
    updated_at: "2023-06-15T14:50:00Z",
    rating: 4.7,
    review_count: 264,
    reviews: [],
    threads: []
  },
  {
    id: "w9q8e7r6-t5y4u3-i2o1p0-a9s8d7-f6g5h4j3",
    name: "Logitech G915",
    description: "Wireless mechanical gaming keyboard with low-profile switches",
    category: "keyboards",
    price: 249.99,
    url_slug: "logitech-g915",
    image_url: "/images/products/placeholder-keyboard.svg",
    specifications: {
      "Switches": "GL Low Profile",
      "Backlight": "RGB Per-Key",
      "Layout": "Full-size",
      "Battery Life": "Up to 30 hours",
      "Media Controls": "Dedicated",
      "Connection": "Lightspeed Wireless/Bluetooth"
    },
    created_at: "2023-04-05T13:10:00Z",
    updated_at: "2023-09-10T10:30:00Z",
    rating: 4.8,
    review_count: 197,
    reviews: [],
    threads: []
  }
];

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/products called');
    
    // Get category filter from query params
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const clientId = searchParams.get('clientId') || 'anonymous';
    
    // Filter products by category if specified
    let filteredProducts = category && category !== 'all'
      ? mockProducts.filter(p => p.category === category)
      : mockProducts;
      
    // Get vote state to add vote counts
    try {
      const voteState = await getVoteState();
      
      // Enhance products with vote data
      filteredProducts = filteredProducts.map(product => {
        const voteCounts = voteState.voteCounts[product.id] || { upvotes: 0, downvotes: 0 };
        const userVote = voteState.votes[`${product.id}:${clientId}`] || null;
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