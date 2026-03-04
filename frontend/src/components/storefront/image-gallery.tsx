/** Image gallery with main display and thumbnail strip. */

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ProductMediaRead } from "@/types/database";

interface ImageGalleryProps {
  media: ProductMediaRead[];
}

export function ImageGallery({ media }: ImageGalleryProps) {
  /** Main image + clickable thumbnail strip. Falls back to placeholder. */
  const images = media.filter((m) => m.media_type === "image");
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-muted text-muted-foreground">
        No images available
      </div>
    );
  }

  const selected = images[selectedIndex];

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg bg-muted">
        <img
          src={selected.file_url}
          alt={selected.alt_text ?? "Product image"}
          className="aspect-square w-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, index) => (
            <button
              key={img.media_id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                index === selectedIndex
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground/30",
              )}
            >
              <img
                src={img.file_url}
                alt={img.alt_text ?? `Thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
