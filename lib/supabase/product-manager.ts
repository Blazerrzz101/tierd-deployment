import { Product, ProductWithVotes } from '@/types/product';
import { supabase } from '@/lib/supabase/client';

export class ProductManager {
  // ... existing code ...

  static transformProduct(rawProduct: any): Product {
    return {
      id: rawProduct.id,
      name: rawProduct.name,
      description: rawProduct.description,
      category: rawProduct.category,
      price: rawProduct.price,
      imageUrl: rawProduct.image_url,
      url_slug: rawProduct.url_slug,
      specs: rawProduct.specifications || {},
      votes: rawProduct.total_votes || 0,
      rank: rawProduct.rank || 0,
      userVote: null // This will be set by the client based on user's vote
    };
  }

  static transformProductWithVotes(rawProduct: any): ProductWithVotes {
    const base = this.transformProduct(rawProduct);
    return {
      ...base,
      upvotes: rawProduct.upvotes || 0,
      downvotes: rawProduct.downvotes || 0,
      rating: rawProduct.rating || 0,
      review_count: rawProduct.review_count || 0,
      total_votes: rawProduct.total_votes || 0,
      score: rawProduct.score || 0
    };
  }
}
// ... existing code ... 