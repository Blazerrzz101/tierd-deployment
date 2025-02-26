import { NextRequest, NextResponse } from "next/server";
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface VoteCounts {
  upvotes: number;
  downvotes: number;
}

interface VoteState {
  votes: Record<string, number>;
  voteCounts: Record<string, VoteCounts>;
  lastUpdated: string;
}

const VOTE_FILE = path.join(process.cwd(), 'data', 'votes.json');

// Get vote state
async function getVoteState(): Promise<VoteState> {
  try {
    if (existsSync(VOTE_FILE)) {
      const data = await fs.readFile(VOTE_FILE, 'utf8');
      const state = JSON.parse(data);
      return {
        votes: state.votes || {},
        voteCounts: state.voteCounts || {},
        lastUpdated: state.lastUpdated || new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Error reading vote state:', error);
  }
  return { votes: {}, voteCounts: {}, lastUpdated: new Date().toISOString() };
}

// Initialize some default vote counts if they don't exist
function ensureProductVoteCounts(productId: string, state: VoteState): VoteCounts {
  if (!state.voteCounts[productId]) {
    state.voteCounts[productId] = { upvotes: 5, downvotes: 2 };
  }
  return state.voteCounts[productId];
}

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
    updated_at: "2023-06-20T15:30:00Z"
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
    updated_at: "2023-07-05T11:45:00Z"
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
    updated_at: "2023-08-12T10:20:00Z"
  },
  {
    id: "d1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6",
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
      "Weight": "121g"
    },
    created_at: "2023-04-01T10:00:00Z",
    updated_at: "2023-09-01T16:45:00Z"
  },
  {
    id: "t1u2v3w4-x5y6-z7a8-b9c0-d1e2f3g4h5i6",
    name: "Corsair K95 RGB PLATINUM",
    description: "Premium mechanical gaming keyboard with Cherry MX switches",
    category: "keyboards",
    price: 199.99,
    url_slug: "corsair-k95-rgb-platinum",
    image_url: "/images/products/placeholder-keyboard.svg",
    specifications: {
      "Switches": "Cherry MX Speed",
      "Backlighting": "RGB",
      "Media Keys": "Yes",
      "Wrist Rest": "Detachable",
      "USB Passthrough": "Yes"
    },
    created_at: "2023-05-15T09:30:00Z",
    updated_at: "2023-10-01T11:20:00Z"
  },
  {
    id: "j1k2l3m4-n5o6-p7q8-r9s0-t1u2v3w4x5y6",
    name: "ASUS ROG Swift PG279QM",
    description: "27-inch 1440p 240Hz Gaming Monitor",
    category: "monitors",
    price: 849.99,
    url_slug: "asus-rog-swift-pg279qm",
    image_url: "/images/products/placeholder-monitor.svg",
    specifications: {
      "Panel": "IPS",
      "Resolution": "2560x1440",
      "Refresh Rate": "240Hz",
      "Response Time": "1ms",
      "HDR": "HDR400"
    },
    created_at: "2023-06-20T14:15:00Z",
    updated_at: "2023-11-05T13:30:00Z"
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
    
    // Load vote state
    const state = await getVoteState();
    
    // Filter products by category if provided
    let filteredProducts = [...mockProducts];
    if (category) {
      filteredProducts = filteredProducts.filter(product => 
        product.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Add vote information to each product
    const productsWithVotes = filteredProducts.map(product => {
      // Get vote counts from file state
      const counts = ensureProductVoteCounts(product.id, state);
      
      // Get user's vote from file state
      const voteKey = `${product.id}:${clientId}`;
      const userVote = state.votes[voteKey];
      
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
    productsWithVotes.sort((a, b) => {
      // First sort by score
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      
      // If scores are equal, sort by total votes
      const totalVotesA = a.upvotes + a.downvotes;
      const totalVotesB = b.upvotes + b.downvotes;
      
      if (totalVotesB !== totalVotesA) {
        return totalVotesB - totalVotesA;
      }
      
      // If total votes are equal, sort by name
      return a.name.localeCompare(b.name);
    });
    
    // Paginate results
    const start = (page - 1) * pageSize;
    const paginatedProducts = productsWithVotes.slice(start, start + pageSize);
    
    console.log('Fetched products from API:', paginatedProducts.length);
    
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