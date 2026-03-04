/** Dashboard category list with create/edit/delete actions. */

"use client";

import { useState } from "react";
import {
  useDashboardCategories,
  useDeleteCategory,
} from "@/hooks/use-dashboard-categories";
import { CategoryFormDialog } from "./category-form-dialog";
import { ConfirmDialog } from "./confirm-dialog";
import { EmptyState } from "@/components/storefront/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, FolderTree } from "lucide-react";
import { toast } from "sonner";
import type { CategoryRead } from "@/types/database";

interface CategoryListProps {
  slug: string;
}

export function CategoryList({ slug }: CategoryListProps) {
  /** Renders categories table with CRUD dialogs. */
  const { data: categories, isLoading } = useDashboardCategories(slug);
  const deleteCategory = useDeleteCategory(slug);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRead | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleEdit = (cat: CategoryRead) => {
    setEditingCategory(cat);
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteCategory.mutate(deleteTarget, {
      onSuccess: () => {
        toast.success("Category deleted");
        setDeleteTarget(null);
      },
      onError: () => toast.error("Failed to delete category"),
    });
  };

  /** Find parent name for display. */
  const getParentName = (parentId: string | null) => {
    if (!parentId || !categories) return null;
    return categories.find((c) => c.category_id === parentId)?.name ?? null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Button
          onClick={() => {
            setEditingCategory(undefined);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !categories || categories.length === 0 ? (
        <EmptyState
          icon={<FolderTree className="h-12 w-12" />}
          title="No categories"
          description="Create categories to organize your products."
          action={
            <Button
              onClick={() => {
                setEditingCategory(undefined);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Sort Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.category_id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {cat.slug}
                  </TableCell>
                  <TableCell>
                    {getParentName(cat.parent_id) ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{cat.sort_order}</TableCell>
                  <TableCell>
                    <Badge variant={cat.is_active ? "default" : "secondary"}>
                      {cat.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(cat)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(cat.category_id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingCategory(undefined);
        }}
        slug={slug}
        category={editingCategory}
        categories={categories ?? []}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Category"
        description="Are you sure? Products in this category will become uncategorized."
        confirmLabel="Delete"
        isPending={deleteCategory.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
