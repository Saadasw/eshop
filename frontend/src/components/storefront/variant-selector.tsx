/** Variant pill buttons with selected state and out-of-stock handling. */

"use client";

import { cn } from "@/lib/utils";
import { formatBDT } from "@/lib/utils/format";
import type { VariantRead } from "@/types/database";

interface VariantSelectorProps {
  variants: VariantRead[];
  selectedId: string;
  onSelect: (variantId: string) => void;
}

export function VariantSelector({
  variants,
  selectedId,
  onSelect,
}: VariantSelectorProps) {
  /** Renders variant pills. Skips if only a default variant exists. */
  const namedVariants = variants.filter((v) => v.variant_name && v.is_active);

  if (namedVariants.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Variant</p>
      <div className="flex flex-wrap gap-2">
        {namedVariants.map((variant) => {
          const outOfStock = variant.stock_quantity <= 0;
          return (
            <button
              key={variant.variant_id}
              onClick={() => !outOfStock && onSelect(variant.variant_id)}
              disabled={outOfStock}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                variant.variant_id === selectedId
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary",
                outOfStock && "cursor-not-allowed opacity-50 line-through",
              )}
            >
              {variant.variant_name}
              {variant.price !== variants.find((v) => v.is_default)?.price && (
                <span className="ml-1 text-xs">({formatBDT(variant.price)})</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
