import { NextRequest, NextResponse } from "next/server";
import { mockProducts } from "./route";
import { expandProductDatabase } from "@/utils/product-expander";
import { Product } from "@/types/product";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET handler for the expanded products API
 * Returns all products or filters by category if provided
 */
export async function GET(request: NextRequest) {
  try {
    // Get URL and extract category from query params
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    
    console.log(`[Expanded API] Request for products. Category filter: ${category || "none"}`);

    // Get base products and expand them
    // Cast mockProducts to any to avoid type errors
    const baseProducts = mockProducts as unknown as Product[];
    const expandedProducts = expandProductDatabase(baseProducts);
    
    // Log the expanded product count for debugging
    console.log(`[Expanded API] Total expanded products: ${expandedProducts.length}`);
    
    // Filter by category if provided
    let filteredProducts: Product[] = expandedProducts;
    if (category && category !== "all") {
      filteredProducts = expandedProducts.filter(
        (product) => product.category === category
      );
      console.log(`[Expanded API] Filtered to ${filteredProducts.length} products in category '${category}'`);
    }
    
    // Sort products by score (then by rank as a secondary sort)
    filteredProducts.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      return a.rank - b.rank;
    });

    // Return the response
    return NextResponse.json(filteredProducts);
  } catch (error) {
    console.error("[Expanded API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch expanded products" },
      { status: 500 }
    );
  }
} 