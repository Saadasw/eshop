/** Dashboard product list with search, filters, and action buttons. */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useProducts } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { useDeleteProduct } from "@/hooks/use-dashboard-products";
import { ConfirmDialog } from "./confirm-dialog";
import { Pagination } from "@/components/storefront/pagination";
import { EmptyState } from "@/components/storefront/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES, DEFAULT_PAGE_SIZE } from "@/lib/utils/constants";
import { formatBDT } from "@/lib/utils/format";
import { Plus, Pencil, Trash2, Package, Star } from "lucide-react";
import { toast } from "sonner";

interface ProductListProps {
  slug: string;
}

export function ProductList({ slug }: ProductListProps) {
  /** Renders products table with search, category/status filters, and CRUD actions. */
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [skip, setSkip] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: categories } = useCategories(slug);
  const deleteProduct = useDeleteProduct(slug);

  const { data, isLoading } = useProducts(slug, {
    skip,
    limit: DEFAULT_PAGE_SIZE,
    search: search || undefined,
    category_id: categoryFilter === "all" ? undefined : categoryFilter,
    is_active:
      activeFilter === "all" ? undefined : activeFilter === "active",
  });

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteProduct.mutate(deleteTarget, {
      onSuccess: () => {
        toast.success("Product deleted");
        setDeleteTarget(null);
      },
      onError: () => toast.error("Failed to delete product"),
    });
  };

  /** Get total stock across all variants. */
  const getTotalStock = (variants: { stock_quantity: number }[]) =>
    variants.reduce((sum, v) => sum + v.stock_quantity, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button asChild>
          <Link href={ROUTES.DASHBOARD_PRODUCT_NEW(slug)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSkip(0);
          }}
          className="w-64"
        />
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setSkip(0); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.category_id} value={cat.category_id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v); setSkip(0); }}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="No products"
          description="Add your first product to get started."
          action={
            <Button asChild>
              <Link href={ROUTES.DASHBOARD_PRODUCT_NEW(slug)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((product) => {
                  const primaryImage = product.media.find((m) => m.is_primary);
                  return (
                    <TableRow key={product.product_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {primaryImage ? (
                            <img
                              src={primaryImage.file_url}
                              alt={product.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <div className="flex items-center gap-1">
                              {product.is_featured && (
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              )}
                              {product.brand && (
                                <span className="text-xs text-muted-foreground">
                                  {product.brand}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {product.sku}
                      </TableCell>
                      <TableCell>{formatBDT(product.base_price)}</TableCell>
                      <TableCell>{getTotalStock(product.variants)}</TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? "default" : "secondary"}>
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={ROUTES.DASHBOARD_PRODUCT_EDIT(slug, product.product_id)}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(product.product_id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <Pagination
            total={data.total}
            skip={skip}
            limit={DEFAULT_PAGE_SIZE}
            onChange={setSkip}
          />
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Product"
        description="Are you sure? This product and all its variants will be soft-deleted."
        confirmLabel="Delete"
        isPending={deleteProduct.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
