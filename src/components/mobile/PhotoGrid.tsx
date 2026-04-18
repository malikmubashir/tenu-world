"use client";

/**
 * Photo grid for one room. Three columns, square cells, light lift
 * border. Tap-to-expand is deferred to post-scaffold. Upload status
 * is rendered as a small badge in the top-right of each tile.
 */
import Image from "next/image";
import { Check, Clock, CloudUpload } from "lucide-react";
import type { LocalPhotoRecord } from "@/lib/mobile/storage/photos";

interface PhotoGridProps {
  photos: LocalPhotoRecord[];
  emptyLabel?: string;
}

export default function PhotoGrid({
  photos,
  emptyLabel = "Aucune photo pour cette pièce.",
}: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <div className="flex min-h-[96px] items-center justify-center rounded-xl border border-dashed border-tenu-cream-dark bg-white/50 px-4 py-6 text-center text-sm text-tenu-slate/60">
        {emptyLabel}
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-3 gap-2">
      {photos.map((photo) => (
        <li
          key={photo.id}
          className="relative aspect-square overflow-hidden rounded-xl bg-tenu-cream-dark"
        >
          <Image
            src={photo.localPath}
            alt=""
            fill
            sizes="(max-width: 480px) 33vw, 120px"
            className="object-cover"
          />
          <span
            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white"
            aria-label={statusLabel(photo)}
            title={statusLabel(photo)}
          >
            {photo.uploadedAt ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <CloudUpload className="h-3.5 w-3.5" />
            )}
          </span>
          {!photo.uploadedAt && (
            <span className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
              <Clock className="h-3 w-3" />
              en attente
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function statusLabel(photo: LocalPhotoRecord): string {
  if (photo.uploadedAt) return "Envoyée";
  return "En attente d'envoi";
}
