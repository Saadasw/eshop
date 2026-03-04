/** Media grid with upload, set primary, and delete actions. */

"use client";

import { useRef } from "react";
import {
  useUploadMedia,
  useDeleteMedia,
  useSetPrimaryMedia,
} from "@/hooks/use-dashboard-products";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import type { ProductMediaRead } from "@/types/database";

interface MediaUploadSectionProps {
  slug: string;
  productId: string;
  media: ProductMediaRead[];
}

export function MediaUploadSection({
  slug,
  productId,
  media,
}: MediaUploadSectionProps) {
  /** Renders media grid with upload button, primary toggle, and delete. */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMedia = useUploadMedia(slug);
  const deleteMedia = useDeleteMedia(slug);
  const setPrimary = useSetPrimaryMedia(slug);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      uploadMedia.mutate(
        { productId, file, isPrimary: media.length === 0 },
        {
          onSuccess: () => toast.success("Image uploaded"),
          onError: () => toast.error("Failed to upload image"),
        },
      );
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = (mediaId: string) => {
    deleteMedia.mutate(
      { productId, mediaId },
      {
        onSuccess: () => toast.success("Image deleted"),
        onError: () => toast.error("Failed to delete image"),
      },
    );
  };

  const handleSetPrimary = (mediaId: string) => {
    setPrimary.mutate(
      { productId, mediaId },
      {
        onSuccess: () => toast.success("Primary image updated"),
        onError: () => toast.error("Failed to set primary image"),
      },
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Images</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMedia.isPending}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploadMedia.isPending ? "Uploading..." : "Upload"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardHeader>
      <CardContent>
        {media.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No images yet. Upload product images to get started.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {media.map((item) => (
              <div key={item.media_id} className="group relative">
                <img
                  src={item.file_url}
                  alt={item.alt_text ?? "Product image"}
                  className="aspect-square w-full rounded-md object-cover"
                />
                {item.is_primary && (
                  <Badge className="absolute left-1 top-1 text-xs">
                    Primary
                  </Badge>
                )}
                <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {!item.is_primary && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleSetPrimary(item.media_id)}
                      disabled={setPrimary.isPending}
                    >
                      <Star className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDelete(item.media_id)}
                    disabled={deleteMedia.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
