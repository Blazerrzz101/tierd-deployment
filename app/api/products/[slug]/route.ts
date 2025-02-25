import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Import the mockVotes Map from the vote API
// This is a workaround for the mock implementation
// In a real app, this would be handled by a database
import { mockVotes, ensureProductVoteCounts } from "../../vote/route";

// Mock product data for testing
const mockProducts = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Sennheiser HD 560S",
    description: "Reference-grade headphones for audiophiles",
    category: "headphones",
    price: 199.95,
    url_slug: "sennheiser-hd-560s",
    image_url: "/images/products/placeholder-headset.svg",
    specifications: {
      "Type": "Open-back, over-ear",
      "Frequency Response": "6 Hz - 38 kHz",
      "Impedance": "120 Ohms",
      "Sound Pressure Level": "110 dB",
      "Weight": "240g"
    },
    created_at: "2023-01-15T12:00:00Z",
    updated_at: "2023-06-20T15:30:00Z",
    upvotes: 5,
    downvotes: 2,
    score: 3,
    rating: 4.2,
    review_count: 128,
    reviews: [
      {
        id: "rev-001",
        rating: 5,
        title: "Excellent sound quality",
        content: "These headphones have amazing clarity and detail. Highly recommended for critical listening.",
        created_at: "2023-03-15T14:30:00Z",
        user: {
          id: "user-001",
          display_name: "AudioEnthusiast",
          avatar_url: null
        }
      }
    ],
    threads: [
      {
        id: "thread-001",
        title: "HD 560S vs HD 600",
        content: "How does the HD 560S compare to the HD 600 for classical music?",
        created_at: "2023-04-10T09:15:00Z",
        user: {
          id: "user-002",
          display_name: "ClassicalFan",
          avatar_url: null
        }
      }
    ]
  },
  {
    id: "9dd2bfe2-6eef-40de-ae12-c35ff1975914",
    name: "Logitech G Pro X",
    description: "Professional gaming headset with Blue VO!CE microphone technology",
    category: "headsets",
    price: 129.99,
    url_slug: "logitech-g-pro-x",
    image_url: "/images/products/placeholder-headset.svg",
    specifications: {
      "Type": "Closed-back, over-ear",
      "Frequency Response": "20 Hz - 20 kHz",
      "Impedance": "35 Ohms",
      "Microphone": "Detachable",
      "Connection": "3.5mm / USB",
      "Weight": "320g"
    },
    created_at: "2023-02-10T09:15:00Z",
    updated_at: "2023-07-05T11:45:00Z",
    upvotes: 8,
    downvotes: 1,
    score: 7,
    rating: 4.5,
    review_count: 256,
    reviews: [
      {
        id: "rev-002",
        rating: 4,
        title: "Great for gaming",
        content: "Excellent microphone quality and comfortable for long gaming sessions.",
        created_at: "2023-05-20T18:45:00Z",
        user: {
          id: "user-003",
          display_name: "ProGamer",
          avatar_url: null
        }
      }
    ],
    threads: [
      {
        id: "thread-002",
        title: "Microphone settings",
        content: "What are the best Blue VO!CE settings for streaming?",
        created_at: "2023-06-15T20:30:00Z",
        user: {
          id: "user-004",
          display_name: "StreamerPro",
          avatar_url: null
        }
      }
    ]
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
    upvotes: 12,
    downvotes: 3,
    score: 9,
    rating: 4.7,
    review_count: 189,
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
    console.log(`Fetching product with slug: ${slug}`);
    
    // Find the product with the matching slug
    const product = mockProducts.find(p => p.url_slug === slug);
    
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    
    // Get the latest vote counts from the mockVotes Map
    const voteCounts = ensureProductVoteCounts(product.id);
    const score = voteCounts.upvotes - voteCounts.downvotes;
    
    // Create a new product object with the updated vote counts
    const updatedProduct = {
      ...product,
      upvotes: voteCounts.upvotes,
      downvotes: voteCounts.downvotes,
      score: score
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