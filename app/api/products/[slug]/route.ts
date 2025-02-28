import { NextRequest, NextResponse } from "next/server";
import { getVoteState } from '../../../lib/vote-utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Mock product data for testing
const mockProducts = [
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
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const clientId = request.nextUrl.searchParams.get('clientId') || 'anonymous';
    console.log(`Fetching product with slug: ${slug}`);
    
    // Find the product with the matching slug
    const product = mockProducts.find(p => p.url_slug === slug);
    
    if (!product) {
      console.error(`Product not found with slug: ${slug}`);
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    
    // Get vote state
    const voteState = await getVoteState();
    const voteCounts = voteState.voteCounts[product.id] || { upvotes: 0, downvotes: 0 };
    const score = voteCounts.upvotes - voteCounts.downvotes;
    const userVote = voteState.votes[`${product.id}:${clientId}`] || null;
    
    // Create a new product object with the updated vote counts
    const updatedProduct = {
      ...product,
      upvotes: voteCounts.upvotes,
      downvotes: voteCounts.downvotes,
      score: score,
      userVote: userVote
    };
    
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 