import { Card } from "@/components/ui/card";
import { VoteButtons } from "@/components/vote-buttons";
import { Product } from "@/types/product";
import Image from "next/image";
import Link from "next/link";

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
        <VoteButtons
          product={{
            id: product.id,
            userVote: product.userVote,
            upvotes: product.upvotes,
            downvotes: product.downvotes,
          }}
        />
      </div>
      <div className="flex flex-1 items-center gap-4">
        <div className="relative h-24 w-24 overflow-hidden rounded-lg">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1">
          <Link
            href={`/products/${product.url_slug}`}
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