/** Responsive grid of product cards with empty state fallback. */

import { ProductCard } from "./product-card";
import { EmptyState } from "./empty-state";
import { Search } from "lucide-react";
import type { ProductRead } from "@/types/database";

interface ProductGridProps {
  products: ProductRead[];
  shopSlug: string;
}

export function ProductGrid({ products, shopSlug }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={<Search className="h-12 w-12" />}
        title="No products found"
        description="Try adjusting your search or filters."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.product_id}
          product={product}
          shopSlug={shopSlug}
        />
      ))}
    </div>
  );
}
