import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: Request): Promise<Response> {
  try {
    // Fetch all products along with their votes and reviews
    const { data: products, error: productError } = await supabase
      .from("products")
      .select("id, votes(vote_type), reviews(rating)");

    if (productError) {
      console.error("Database error:", productError.message);
      return new Response(
        JSON.stringify({ error: productError.message }),
        { status: 500 }
      );
    }

    if (!products) {
      console.error("No products found");
      return new Response(
        JSON.stringify({ error: "No products found" }),
        { status: 404 }
      );
    }

    // Calculate rankings
    const updatedProducts = products.map((product: any) => {
      const upvotes = product.votes.filter((vote: any) => vote.vote_type === "up").length;
      const downvotes = product.votes.filter((vote: any) => vote.vote_type === "down").length;
      const totalVotes = upvotes - downvotes;

      const averageRating =
        product.reviews.length > 0
          ? product.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / product.reviews.length
          : 0;

      // Example ranking algorithm: 70% votes + 30% average rating
      const ranking = totalVotes * 0.7 + averageRating * 0.3;

      return { id: product.id, ranking };
    });

    // Update rankings in the database
    const { error: updateError } = await supabase
      .from("products")
      .upsert(updatedProducts.map((p: any) => ({ id: p.id, ranking: p.ranking })));

    if (updateError) {
      console.error("Database update error:", updateError.message);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Rankings updated successfully" }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Server error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}