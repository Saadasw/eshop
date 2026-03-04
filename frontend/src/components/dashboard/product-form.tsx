/** Shared product create/edit form with basic info, toggles, and tags. */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCategories } from "@/hooks/use-categories";
import { useCreateProduct, useUpdateProduct } from "@/hooks/use-dashboard-products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ROUTES } from "@/lib/utils/constants";
import { toast } from "sonner";
import type { ProductRead, ProductType } from "@/types/database";

interface ProductFormProps {
  slug: string;
  product?: ProductRead;
}

const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: "physical", label: "Physical" },
  { value: "digital", label: "Digital" },
  { value: "service", label: "Service" },
];

export function ProductForm({ slug, product }: ProductFormProps) {
  /** Renders product form for creating or editing. */
  const router = useRouter();
  const isEdit = !!product;
  const { data: categories } = useCategories(slug);
  const createProduct = useCreateProduct(slug);
  const updateProduct = useUpdateProduct(slug);

  const [form, setForm] = useState({
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    base_price: product?.base_price ?? "",
    compare_at_price: product?.compare_at_price ?? "",
    description: product?.description ?? "",
    category_id: product?.category_id ?? "",
    product_type: (product?.product_type ?? "physical") as ProductType,
    brand: product?.brand ?? "",
    weight_grams: product?.weight_grams?.toString() ?? "",
    is_active: product?.is_active ?? true,
    is_featured: product?.is_featured ?? false,
    tagsInput: product?.tags?.join(", ") ?? "",
  });

  const isPending = createProduct.isPending || updateProduct.isPending;

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.sku.trim() || !form.base_price) {
      toast.error("Name, SKU, and price are required");
      return;
    }

    const tags = form.tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      base_price: form.base_price,
      compare_at_price: form.compare_at_price || undefined,
      description: form.description || undefined,
      category_id: form.category_id || undefined,
      product_type: form.product_type,
      brand: form.brand || undefined,
      weight_grams: form.weight_grams ? parseInt(form.weight_grams) : undefined,
      is_active: form.is_active,
      is_featured: form.is_featured,
      tags,
    };

    if (isEdit) {
      updateProduct.mutate(
        { productId: product.product_id, data: payload },
        {
          onSuccess: () => {
            toast.success("Product updated");
            router.push(ROUTES.DASHBOARD_PRODUCTS(slug));
          },
          onError: () => toast.error("Failed to update product"),
        },
      );
    } else {
      createProduct.mutate(payload, {
        onSuccess: (created) => {
          toast.success("Product created");
          router.push(ROUTES.DASHBOARD_PRODUCT_EDIT(slug, created.product_id));
        },
        onError: () => toast.error("Failed to create product"),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isEdit ? "Edit Product" : "New Product"}
        </h1>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.DASHBOARD_PRODUCTS(slug))}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Product"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g. Basmati Rice 5kg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={form.sku}
                    onChange={(e) => handleChange("sku", e.target.value)}
                    placeholder="e.g. RICE-BAS-5KG"
                    disabled={isEdit}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Product description..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="base_price">Base Price (BDT) *</Label>
                  <Input
                    id="base_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.base_price}
                    onChange={(e) => handleChange("base_price", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compare_at_price">Compare at Price (BDT)</Label>
                  <Input
                    id="compare_at_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.compare_at_price}
                    onChange={(e) => handleChange("compare_at_price", e.target.value)}
                    placeholder="Original price for strikethrough"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={form.category_id || "none"}
                    onValueChange={(v) => handleChange("category_id", v === "none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No category</SelectItem>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.category_id} value={cat.category_id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product_type">Product Type</Label>
                  <Select
                    value={form.product_type}
                    onValueChange={(v) => handleChange("product_type", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={form.brand}
                    onChange={(e) => handleChange("brand", e.target.value)}
                    placeholder="Brand name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (grams)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    value={form.weight_grams}
                    onChange={(e) => handleChange("weight_grams", e.target.value)}
                    placeholder="e.g. 5000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={form.tagsInput}
                  onChange={(e) => handleChange("tagsInput", e.target.value)}
                  placeholder="e.g. rice, organic, premium"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={form.is_active}
                  onCheckedChange={(v) => handleChange("is_active", v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="is_featured">Featured</Label>
                <Switch
                  id="is_featured"
                  checked={form.is_featured}
                  onCheckedChange={(v) => handleChange("is_featured", v)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
