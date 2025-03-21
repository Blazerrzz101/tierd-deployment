import { Metadata } from "next";
import { ExpandedProductList } from "@/components/products/expanded-product-list";

export const metadata: Metadata = {
  title: "Expanded Gaming Gear Catalog | Tierd",
  description: "Explore our expanded catalog of gaming peripherals including monitors, mice, keyboards, and headsets.",
};

export default function ExpandedCatalogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">
        Expanded Gaming Gear Catalog
      </h1>
      <p className="text-muted-foreground mb-8">
        Browse our extended collection of gaming peripherals with over 20 products in each category.
      </p>
      
      <ExpandedProductList />
    </div>
  );
} 