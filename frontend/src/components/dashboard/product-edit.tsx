/** Product edit wrapper: fetches product, renders form with variant and media sections. */

"use client";

import { useState } from "react";
import { useProduct } from "@/hooks/use-products";
import {
  useCreateVariant,
  useUpdateVariant,
  useDeleteVariant,
} from "@/hooks/use-dashboard-products";
import { ProductForm } from "./product-form";
import { VariantFormDialog } from "./variant-form-dialog";
import { MediaUploadSection } from "./media-upload-section";
import { ConfirmDialog } from "./confirm-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBDT } from "@/lib/utils/format";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { VariantRead } from "@/types/database";

interface ProductEditProps {
  slug: string;
  productId: string;
}

export function ProductEdit({ slug, productId }: ProductEditProps) {
  /** Fetches product and renders form, variants table, and media grid. */
  const { data: product, isLoading } = useProduct(slug, productId);
  const createVariant = useCreateVariant(slug);
  const updateVariant = useUpdateVariant(slug);
  const deleteVariant = useDeleteVariant(slug);

  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<VariantRead | undefined>();
  const [deleteVariantId, setDeleteVariantId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-semibold">Product not found</h2>
      </div>
    );
  }

  const handleVariantSubmit = (data: {
    sku: string;
    variant_name?: string;
    price: string;
    stock_quantity: number;
    low_stock_threshold: number;
    track_inventory: boolean;
    weight_grams?: number;
    is_active?: boolean;
  }) => {
    if (editingVariant) {
      updateVariant.mutate(
        {
          productId,
          variantId: editingVariant.variant_id,
          data: {
            sku: data.sku,
            variant_name: data.variant_name,
            price: data.price,
            stock_quantity: data.stock_quantity,
            low_stock_threshold: data.low_stock_threshold,
            track_inventory: data.track_inventory,
            weight_grams: data.weight_grams,
            is_active: data.is_active,
          },
        },
        {
          onSuccess: () => {
            toast.success("Variant updated");
            setVariantDialogOpen(false);
            setEditingVariant(undefined);
          },
          onError: () => toast.error("Failed to update variant"),
        },
      );
    } else {
      createVariant.mutate(
        {
          productId,
          data: {
            sku: data.sku,
            variant_name: data.variant_name,
            price: data.price,
            stock_quantity: data.stock_quantity,
            low_stock_threshold: data.low_stock_threshold,
            track_inventory: data.track_inventory,
            weight_grams: data.weight_grams,
          },
        },
        {
          onSuccess: () => {
            toast.success("Variant added");
            setVariantDialogOpen(false);
          },
          onError: () => toast.error("Failed to add variant"),
        },
      );
    }
  };

  const handleDeleteVariant = () => {
    if (!deleteVariantId) return;
    deleteVariant.mutate(
      { productId, variantId: deleteVariantId },
      {
        onSuccess: () => {
          toast.success("Variant deleted");
          setDeleteVariantId(null);
        },
        onError: () => toast.error("Failed to delete variant"),
      },
    );
  };

  return (
    <div className="space-y-6">
      <ProductForm slug={slug} product={product} />

      {/* Variants section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Variants ({product.variants.length})
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingVariant(undefined);
              setVariantDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Variant
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.variants.map((v) => (
                  <TableRow key={v.variant_id}>
                    <TableCell>
                      {v.variant_name ?? (
                        <span className="text-muted-foreground">Default</span>
                      )}
                      {v.is_default && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Default
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{v.sku}</TableCell>
                    <TableCell>{formatBDT(v.price)}</TableCell>
                    <TableCell>{v.stock_quantity}</TableCell>
                    <TableCell>
                      <Badge variant={v.is_active ? "default" : "secondary"}>
                        {v.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingVariant(v);
                            setVariantDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!v.is_default && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteVariantId(v.variant_id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Media section */}
      <MediaUploadSection
        slug={slug}
        productId={productId}
        media={product.media}
      />

      {/* Variant form dialog */}
      <VariantFormDialog
        open={variantDialogOpen}
        onOpenChange={(open) => {
          setVariantDialogOpen(open);
          if (!open) setEditingVariant(undefined);
        }}
        variant={editingVariant}
        isPending={createVariant.isPending || updateVariant.isPending}
        onSubmit={handleVariantSubmit}
      />

      {/* Delete variant dialog */}
      <ConfirmDialog
        open={!!deleteVariantId}
        onOpenChange={(open) => !open && setDeleteVariantId(null)}
        title="Delete Variant"
        description="Are you sure you want to delete this variant?"
        confirmLabel="Delete"
        isPending={deleteVariant.isPending}
        onConfirm={handleDeleteVariant}
      />
    </div>
  );
}
