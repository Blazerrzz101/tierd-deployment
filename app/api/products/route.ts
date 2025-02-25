import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { mockVotes, ensureProductVoteCounts } from "../vote/route";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    score: 3
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
    score: 7
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
    score: 9
  }
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const category = searchParams.get('category');
    const clientId = searchParams.get('clientId') || 'anonymous';
    
    console.log('Products API request:', { page, pageSize, category, clientId });
    
    // Filter products by category if provided
    let filteredProducts = [...mockProducts];
    if (category) {
      filteredProducts = filteredProducts.filter(product => 
        product.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Add vote information to each product
    const productsWithVotes = filteredProducts.map(product => {
      // Ensure vote counts exist
      const counts = ensureProductVoteCounts(product.id);
      
      // Get user's vote
      const voteKey = `${product.id}:${clientId}`;
      const userVote = mockVotes.get(voteKey);
      
      // Calculate score
      const score = counts.upvotes - counts.downvotes;
      
      return {
        ...product,
        upvotes: counts.upvotes,
        downvotes: counts.downvotes,
        score: score,
        userVote: {
          hasVoted: userVote !== undefined,
          voteType: userVote !== undefined ? userVote : null
        }
      };
    });
    
    // Sort products by score (descending)
    productsWithVotes.sort((a, b) => b.score - a.score);
    
    // Paginate results
    const start = (page - 1) * pageSize;
    const paginatedProducts = productsWithVotes.slice(start, start + pageSize);
    
    return NextResponse.json({
      success: true,
      products: paginatedProducts,
      pagination: {
        page,
        pageSize,
        total: filteredProducts.length,
        totalPages: Math.ceil(filteredProducts.length / pageSize)
      }
    });
  } catch (error) {
    console.error('Products API error:', error);
    
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 