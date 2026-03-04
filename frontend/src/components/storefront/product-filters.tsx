/** Orchestrates SearchBar + SortSelect + CategoryFilter into a filter bar. */

"use client";

import { SearchBar } from "./search-bar";
import { SortSelect } from "./sort-select";
import { CategoryFilter } from "./category-filter";
import type { CategoryRead } from "@/types/database";

interface ProductFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  sort: string;
  onSortChange: (value: string) => void;
  categories: CategoryRead[];
  selectedCategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}

export function ProductFilters({
  search,
  onSearchChange,
  sort,
  onSortChange,
  categories,
  selectedCategoryId,
  onCategoryChange,
}: ProductFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <SearchBar value={search} onChange={onSearchChange} />
        </div>
        <SortSelect value={sort} onChange={onSortChange} />
      </div>
      <CategoryFilter
        categories={categories}
        selectedId={selectedCategoryId}
        onSelect={onCategoryChange}
      />
    </div>
  );
}
