import { Card } from "@/components/ui/card";
import { Product } from "@/types/product";
import Image from "next/image";
import Link from "next/link";
import { createProductUrl } from "@/utils/product-utils";
import { ProductVoteWrapper } from "@/components/products/product-vote-wrapper";
import { GlobalVoteButtons } from "@/components/products/global-vote-buttons";

interface ProductRankingCardProps {
  product: Product;
  rank: number;
}

function ProductRankingCard({ product, rank }: ProductRankingCardProps) {
  return (
    <Card className="flex items-start gap-4 p-4">
      <div className="flex items-center gap-4">
        <span className="text-2xl font-bold text-muted-foreground">
          {rank}
        </span>
        <ProductVoteWrapper product={product}>
          {() => (
            <GlobalVoteButtons product={product} />
          )}
        </ProductVoteWrapper>
      </div>
      <div className="flex flex-1 items-center gap-4">
        <div className="relative h-24 w-24 overflow-hidden rounded-lg">
          <Image
            src={product.imageUrl || product.image_url || "/images/product-placeholder.png"}
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1">
          <Link
            href={createProductUrl(product)}
            className="text-lg font-semibold hover:underline"
          >
            {product.name}
          </Link>
          <p className="text-sm text-muted-foreground">
            {product.description}
          </p>
        </div>
      </div>
    </Card>
  );
}

interface ProductRankingsProps {
  products: Product[];
}

export function ProductRankings({ products }: ProductRankingsProps) {
  return (
    <div className="space-y-4">
      {products.map((product, index) => (
        <ProductRankingCard
          key={product.id}
          product={product}
          rank={index + 1}
        />
      ))}
    </div>
  );
} 