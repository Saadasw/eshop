/** Product detail page with image gallery, variant selector, and add-to-cart. */

"use client";

import { useState } from "react";
import { useProduct } from "@/hooks/use-products";
import { ImageGallery } from "./image-gallery";
import { PriceDisplay } from "./price-display";
import { RatingStars } from "./rating-stars";
import { VariantSelector } from "./variant-selector";
import { AddToCartButton } from "./add-to-cart-button";
import { ProductReviews } from "./product-reviews";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductDetailProps {
  slug: string;
  productId: string;
}

export function ProductDetail({ slug, productId }: ProductDetailProps) {
  const { data: product, isLoading } = useProduct(slug, productId);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );

  if (isLoading) {
    return (
      <div className="grid gap-8 md:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-semibold">Product not found</h2>
        <p className="mt-1 text-muted-foreground">
          This product doesn&apos;t exist or has been removed.
        </p>
      </div>
    );
  }

  const defaultVariant = product.variants.find((v) => v.is_default);
  const activeVariant =
    product.variants.find((v) => v.variant_id === selectedVariantId) ??
    defaultVariant ??
    product.variants[0];

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <ImageGallery media={product.media} />

      <div className="space-y-4">
        {product.brand && (
          <p className="text-sm text-muted-foreground">{product.brand}</p>
        )}
        <h1 className="text-2xl font-bold">{product.name}</h1>

        {product.review_count > 0 && (
          <RatingStars
            rating={product.avg_rating}
            reviewCount={product.review_count}
            size="md"
          />
        )}

        <PriceDisplay
          price={activeVariant?.price ?? product.base_price}
          compareAtPrice={
            activeVariant?.compare_at_price ?? product.compare_at_price
          }
          minPrice={product.min_price}
          maxPrice={product.max_price}
        />

        <div className="flex gap-2">
          {product.is_new && <Badge>New</Badge>}
          {product.is_featured && <Badge variant="secondary">Featured</Badge>}
          {product.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>

        {product.description && (
          <>
            <Separator />
            <div className="prose prose-sm max-w-none text-muted-foreground">
              <p>{product.description}</p>
            </div>
          </>
        )}

        <Separator />

        <VariantSelector
          variants={product.variants}
          selectedId={activeVariant?.variant_id ?? ""}
          onSelect={setSelectedVariantId}
        />

        {activeVariant && (
          <div className="text-sm text-muted-foreground">
            {activeVariant.stock_quantity > 0
              ? `${activeVariant.stock_quantity} in stock`
              : "Out of stock"}
            {activeVariant.sku && (
              <span className="ml-3">SKU: {activeVariant.sku}</span>
            )}
          </div>
        )}

        <AddToCartButton
          shopSlug={slug}
          variantId={activeVariant?.variant_id ?? ""}
          stockQuantity={activeVariant?.stock_quantity ?? 0}
        />
      </div>

      <div className="md:col-span-2 mt-8">
        <ProductReviews
          slug={slug}
          productId={productId}
          reviewCount={product.review_count}
          avgRating={product.avg_rating}
        />
      </div>
    </div>
  );
}
