/** Dialog for creating or editing a category. */

"use client";

import { useState, useEffect } from "react";
import {
  useCreateCategory,
  useUpdateCategory,
} from "@/hooks/use-dashboard-categories";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateSlug } from "@/lib/utils/slug";
import { toast } from "sonner";
import type { CategoryRead } from "@/types/database";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  category?: CategoryRead;
  categories: CategoryRead[];
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  slug,
  category,
  categories,
}: CategoryFormDialogProps) {
  /** Renders form fields for category creation or editing. */
  const isEdit = !!category;
  const createCategory = useCreateCategory(slug);
  const updateCategory = useUpdateCategory(slug);

  const [form, setForm] = useState({
    name: "",
    categorySlug: "",
    parent_id: "",
    sort_order: "0",
    is_active: true,
  });

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name,
        categorySlug: category.slug,
        parent_id: category.parent_id ?? "",
        sort_order: category.sort_order.toString(),
        is_active: category.is_active,
      });
    } else {
      setForm({
        name: "",
        categorySlug: "",
        parent_id: "",
        sort_order: "0",
        is_active: true,
      });
    }
  }, [category, open]);

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      categorySlug: isEdit ? prev.categorySlug : generateSlug(name),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.categorySlug.trim()) {
      toast.error("Name and slug are required");
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: form.categorySlug.trim(),
      parent_id: form.parent_id || undefined,
      sort_order: parseInt(form.sort_order) || 0,
      is_active: form.is_active,
    };

    if (isEdit) {
      updateCategory.mutate(
        { categoryId: category.category_id, data: payload },
        {
          onSuccess: () => {
            toast.success("Category updated");
            onOpenChange(false);
          },
          onError: () => toast.error("Failed to update category"),
        },
      );
    } else {
      createCategory.mutate(payload, {
        onSuccess: () => {
          toast.success("Category created");
          onOpenChange(false);
        },
        onError: () => toast.error("Failed to create category"),
      });
    }
  };

  const isPending = createCategory.isPending || updateCategory.isPending;

  // Filter out current category from parent options (can't be its own parent)
  const parentOptions = categories.filter(
    (c) => c.category_id !== category?.category_id,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Category" : "Add Category"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Name *</Label>
            <Input
              id="cat-name"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Fresh Vegetables"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-slug">Slug *</Label>
            <Input
              id="cat-slug"
              value={form.categorySlug}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, categorySlug: e.target.value }))
              }
              placeholder="e.g. fresh-vegetables"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-parent">Parent Category</Label>
            <Select
              value={form.parent_id || "none"}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, parent_id: v === "none" ? "" : v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="No parent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No parent</SelectItem>
                {parentOptions.map((c) => (
                  <SelectItem key={c.category_id} value={c.category_id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-sort">Sort Order</Label>
            <Input
              id="cat-sort"
              type="number"
              min="0"
              value={form.sort_order}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, sort_order: e.target.value }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="cat-active">Active</Label>
            <Switch
              id="cat-active"
              checked={form.is_active}
              onCheckedChange={(v) =>
                setForm((prev) => ({ ...prev, is_active: v }))
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
