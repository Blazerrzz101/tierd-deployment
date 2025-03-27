"use client"

import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/products/product-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Product } from '@/types/product';
import { useDebounce } from '@/hooks/use-debounce';
import { motion } from 'framer-motion';
import { createProductUrl } from '@/utils/product-utils';
import { getProductAffiliateLinkAndImage } from '@/utils/affiliate-utils';
import { getEnhancedProductImage } from '@/utils/enhanced-images';
import { ChevronUp, ArrowDown, AlertTriangle, Star, ShoppingCart, ExternalLink, Tag, ThumbsUp, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VoteButtons } from '@/components/products/vote-buttons';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { VoteType } from '@/types/product';
import { ProductVoteWrapper } from "@/components/products/product-vote-wrapper"
import { GlobalVoteButtons } from "@/components/products/global-vote-buttons"

// Helper function to extract vote type from userVote which can be either a number or an object
const getUserVoteType = (userVote: any): number | null => {
  if (userVote === null || userVote === undefined) {
    return null;
  }
  
  if (typeof userVote === 'number') {
    return userVote;
  } 
  
  if (typeof userVote === 'object') {
    if ('voteType' in userVote) {
      const voteType = userVote.voteType;
      // Convert string vote types to numeric
      if (voteType === 'up') return 1;
      if (voteType === 'down') return -1;
      // Already numeric
      if (typeof voteType === 'number') return voteType;
    }
  }
  
  return null; // default: no vote
};

interface RankingListProps {
  category: string;
  isLoading?: boolean;
  viewMode?: "grid" | "list";
  sortOption?: string;
}

export function RankingList({ 
  category, 
  isLoading = false,
  viewMode = "grid",
  sortOption = "votes" 
}: RankingListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = new URL('/api/products', window.location.origin);
        if (category !== 'all') {
          url.searchParams.set('category', category);
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();

        // Check the correct response format - API returns a 'products' array inside the data object
        if (!data.success) {
          throw new Error(data.error || 'Failed to load products');
        }

        const productsData = data.products || [];
        
        if (productsData.length === 0) {
          console.log('No products returned from API');
        } else {
          console.log(`Loaded ${productsData.length} products successfully`);
        }

        // Sort products based on the sortOption
        const sortedProducts = sortProducts(productsData, sortOption);
        setProducts(sortedProducts);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
        toast({
          title: 'Error',
          description: 'Failed to load products. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, toast, sortOption]);

  // Helper function to sort products
  const sortProducts = (products: Product[], option: string) => {
    return [...products].sort((a, b) => {
      switch (option) {
        case 'rank':
          return (a.rank || 999) - (b.rank || 999);
          
        case 'votes':
          // Sort by upvotes - downvotes (score)
          const scoreA = (a.upvotes || 0) - (a.downvotes || 0);
          const scoreB = (b.upvotes || 0) - (b.downvotes || 0);
          return scoreB - scoreA;
          
        case 'rating':
          // Sort by rating (highest first)
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return ratingB - ratingA;
          
        case 'price-low':
          // Sort by price (lowest first)
          const priceLowA = a.price || 0;
          const priceLowB = b.price || 0;
          return priceLowA - priceLowB;
          
        case 'price-high':
          // Sort by price (highest first)
          const priceHighA = a.price || 0;
          const priceHighB = b.price || 0;
          return priceHighB - priceHighA;
          
        case 'newest':
          // Sort by creation date (newest first)
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
          
        default:
          // Default sorting by score
          return ((b.upvotes || 0) - (b.downvotes || 0)) - ((a.upvotes || 0) - (a.downvotes || 0));
      }
    });
  };

  if (isLoading || loading) {
    return (
      <div className={cn(
        "grid gap-6",
        viewMode === "grid" 
          ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" 
          : "grid-cols-1"
      )}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className={cn(
            viewMode === "grid" 
              ? "h-[380px] w-full rounded-xl" 
              : "h-[140px] w-full rounded-xl"
          )} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-8">
        <AlertTriangle className="h-4 w-4 mr-2" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl">
        <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-medium mb-2">No products found</h3>
        <p className="text-muted-foreground">
          {category !== 'all' 
            ? `No products found in the ${category.replace('-', ' ')} category.` 
            : 'No products available at this time.'}
        </p>
      </div>
    );
  }

  // Grid View
  if (viewMode === "grid") {
    return (
      <div className="space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product, index) => {
            const enhancedImage = getEnhancedProductImage(product.name);
            const { affiliateLink } = getProductAffiliateLinkAndImage(product.name);
            
            return (
              <ProductVoteWrapper key={product.id} product={product}>
                {(voteData) => {
                  // Use vote data from the global system
                  const totalVotes = (voteData.upvotes || 0) + (voteData.downvotes || 0);
                  const votesScore = (voteData.upvotes || 0) - (voteData.downvotes || 0);
                  
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <div className="group relative h-full flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:bg-accent/40">
                        <Link href={createProductUrl(product)} className="relative overflow-hidden">
                          <div className="relative aspect-square bg-black/5">
                            <Image 
                              src={enhancedImage || product.imageUrl || product.image_url || "/images/product-placeholder.png"} 
                              alt={product.name}
                              fill
                              className="object-contain p-4 transition-transform group-hover:scale-105"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            
                            {/* Rank Badge */}
                            {product.rank && product.rank <= 10 && (
                              <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-8 w-8 flex items-center justify-center shadow-lg">
                                #{product.rank}
                              </div>
                            )}
                            
                            {/* Price Badge */}
                            {product.price && (
                              <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md text-white text-xs font-medium rounded-full px-2 py-1">
                                ${product.price}
                              </div>
                            )}
                          </div>
                        </Link>
                        
                        <div className="flex flex-col flex-1 p-4">
                          <div className="space-y-1 mb-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="capitalize px-2 text-xs">
                                {product.category?.replace('-', ' ')}
                              </Badge>
                              
                              {product.rating && (
                                <div className="flex items-center text-yellow-400 text-xs">
                                  <Star className="h-3 w-3 fill-yellow-400 mr-0.5" />
                                  {product.rating.toFixed(1)}
                                </div>
                              )}
                            </div>
                            
                            <h3 className="font-semibold leading-tight tracking-tight hover:text-primary transition-colors line-clamp-2">
                              <Link href={createProductUrl(product)}>
                                {product.name}
                              </Link>
                            </h3>
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-grow">
                            {product.description}
                          </p>
                          
                          <div className="mt-auto space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground flex items-center">
                                <ThumbsUp className="h-3 w-3 mr-1" />
                                {totalVotes} votes
                              </span>
                              <span className={cn(
                                "text-xs font-medium",
                                votesScore > 0 ? "text-green-400" : votesScore < 0 ? "text-red-400" : "text-muted-foreground"
                              )}>
                                Score: {votesScore > 0 ? "+" : ""}{votesScore}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <Button asChild variant="outline" size="sm" className="w-full">
                                <Link href={createProductUrl(product)}>
                                  View Details
                                </Link>
                              </Button>
                              
                              {affiliateLink ? (
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  className="w-full bg-[#FF9900] hover:bg-[#FF9900]/90"
                                  asChild
                                >
                                  <a href={affiliateLink} target="_blank" rel="noopener noreferrer">
                                    <ShoppingCart className="h-3 w-3 mr-1" />
                                    Shop
                                  </a>
                                </Button>
                              ) : (
                                <GlobalVoteButtons
                                  product={{ id: product.id, name: product.name }}
                                  className="w-full"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                }}
              </ProductVoteWrapper>
            );
          })}
        </div>
        
        {/* Show result count */}
        <div className="text-center text-sm text-muted-foreground">
          Showing {products.length} {products.length === 1 ? 'product' : 'products'}
          {category !== 'all' && ` in ${category.replace('-', ' ')}`}
          {sortOption && ` sorted by ${sortOption.replace('-', ' to ')}`}
        </div>
      </div>
    );
  }
  
  // List View
  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-3">
        {products.map((product, index) => {
          const enhancedImage = getEnhancedProductImage(product.name);
          const { affiliateLink } = getProductAffiliateLinkAndImage(product.name);
          
          return (
            <ProductVoteWrapper key={product.id} product={product}>
              {(voteData) => {
                // Use vote data from the global system
                const totalVotes = (voteData.upvotes || 0) + (voteData.downvotes || 0);
                const votesScore = (voteData.upvotes || 0) - (voteData.downvotes || 0);
                
                return (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <div className="group relative flex flex-col sm:flex-row overflow-hidden rounded-xl border bg-card transition-colors hover:bg-accent/40">
                      <Link 
                        href={createProductUrl(product)} 
                        className="sm:w-48 lg:w-56 h-auto flex-shrink-0"
                      >
                        <div className="aspect-square sm:aspect-auto sm:h-full relative overflow-hidden bg-black/5">
                          <Image
                            src={enhancedImage || product.imageUrl || product.image_url || "/images/product-placeholder.png"}
                            alt={product.name}
                            fill
                            className="object-contain p-4"
                            sizes="(max-width: 768px) 100vw, 200px"
                          />
                          
                          {/* Rank Badge */}
                          {product.rank && product.rank <= 10 && (
                            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-8 w-8 flex items-center justify-center shadow-lg">
                              #{product.rank}
                            </div>
                          )}
                        </div>
                      </Link>
                      
                      <div className="flex-grow flex flex-col p-4">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <h3 className="font-semibold text-base md:text-lg hover:text-primary transition-colors">
                              <Link href={createProductUrl(product)}>
                                {product.name}
                              </Link>
                            </h3>
                            
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge variant="outline" className="capitalize text-xs">
                                {product.category?.replace('-', ' ')}
                              </Badge>
                              
                              {/* Rating Badge */}
                              {product.rating && (
                                <div className="flex items-center gap-1 text-yellow-400 text-xs">
                                  <div className="flex">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star 
                                        key={i} 
                                        className={cn(
                                          "h-3 w-3",
                                          i < Math.floor(product.rating || 0) ? "fill-yellow-400" : "fill-muted stroke-muted"
                                        )} 
                                      />
                                    ))}
                                  </div>
                                  <span className="font-medium">
                                    {product.rating.toFixed(1)}
                                  </span>
                                </div>
                              )}
                              
                              {/* Vote Score */}
                              <span className={cn(
                                "text-xs flex items-center gap-1",
                                votesScore > 0 ? "text-green-400" : votesScore < 0 ? "text-red-400" : "text-muted-foreground"
                              )}>
                                <ThumbsUp className={cn("h-3 w-3", votesScore < 0 && "rotate-180")} />
                                {votesScore > 0 ? "+" : ""}{votesScore} ({totalVotes} votes)
                              </span>
                              
                              {/* Price */}
                              {product.price && (
                                <span className="text-xs font-medium flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  ${product.price}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex-shrink-0">
                            <GlobalVoteButtons
                              product={{ id: product.id, name: product.name }}
                              className="flex-shrink-0"
                            />
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground my-2 line-clamp-2 flex-grow">
                          {product.description}
                        </p>
                        
                        <div className="flex items-center flex-wrap gap-2 mt-2">
                          <Button 
                            asChild 
                            variant="outline" 
                            size="sm"
                          >
                            <Link href={createProductUrl(product)}>
                              View Details
                            </Link>
                          </Button>
                          
                          {affiliateLink && (
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="bg-[#FF9900] hover:bg-[#FF9900]/90"
                              asChild
                            >
                              <a href={affiliateLink} target="_blank" rel="noopener noreferrer">
                                <ShoppingCart className="h-3 w-3 mr-1" />
                                Shop on Amazon
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              }}
            </ProductVoteWrapper>
          );
        })}
      </div>
      
      {/* Show result count */}
      <div className="text-center text-sm text-muted-foreground">
        Showing {products.length} {products.length === 1 ? 'product' : 'products'}
        {category !== 'all' && ` in ${category.replace('-', ' ')}`}
        {sortOption && ` sorted by ${sortOption.replace('-', ' to ')}`}
      </div>
    </div>
  );
}