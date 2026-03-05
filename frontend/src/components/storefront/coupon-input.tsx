/** Coupon code input with validation for checkout page. */

"use client";

import { useState } from "react";
import { useValidateCoupon } from "@/hooks/use-coupons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, X, Check, Loader2 } from "lucide-react";
import { formatBDT } from "@/lib/utils/format";
import type { CouponValidateResponse } from "@/types/database";

interface CouponInputProps {
  slug: string;
  cartSubtotal: string;
  onApply: (result: CouponValidateResponse) => void;
  onRemove: () => void;
  appliedCode: string | null;
  discountAmount: string | null;
}

export function CouponInput({
  slug,
  cartSubtotal,
  onApply,
  onRemove,
  appliedCode,
  discountAmount,
}: CouponInputProps) {
  /** Renders a coupon code input with apply/remove actions. */
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const validateCoupon = useValidateCoupon(slug);

  const handleApply = () => {
    if (!code.trim()) return;
    setError(null);
    validateCoupon.mutate(
      { code: code.trim(), cartSubtotal },
      {
        onSuccess: (result) => {
          if (result.valid) {
            onApply(result);
            setError(null);
          } else {
            setError(result.message);
          }
        },
        onError: () => {
          setError("Failed to validate coupon");
        },
      },
    );
  };

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            {appliedCode}
          </span>
          {discountAmount && (
            <span className="text-sm text-green-600 dark:text-green-400">
              (-{formatBDT(discountAmount)})
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onRemove}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Coupon code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={handleApply}
          disabled={!code.trim() || validateCoupon.isPending}
        >
          {validateCoupon.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Apply"
          )}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
