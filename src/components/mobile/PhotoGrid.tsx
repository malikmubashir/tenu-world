"use client";

/**
 * Photo grid for one room — Éditorial v2 (#T150). Three columns,
 * square 0-radius tiles separated by hairline-width gaps on a
 * hairline ground (blueprint feel — the gaps read as 1px rules).
 * Upload status renders as a small inverted-black badge in the
 * top-end corner of each tile.
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
      <div className="flex min-h-[96px] items-center justify-center border border-dashed border-tenu-hairline bg-tenu-canvas px-4 py-6 text-center text-sm text-tenu-ink-muted">
        {emptyLabel}
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-3 gap-px border border-tenu-hairline bg-tenu-hairline">
      {photos.map((photo) => (
        <li
          key={photo.id}
          className="relative aspect-square overflow-hidden bg-tenu-canvas"
        >
          <Image
            src={photo.localPath}
            alt=""
            fill
            sizes="(max-width: 480px) 33vw, 120px"
            className="object-cover"
          />
          {/* Logical inset (end-*) keeps badges in the visual corner
              users expect when the app runs RTL (AR/UR). */}
          <span
            className="absolute end-1.5 top-1.5 flex h-6 w-6 items-center justify-center bg-tenu-band-inverted/70 text-tenu-canvas"
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
            <span className="absolute bottom-1.5 start-1.5 flex items-center gap-0.5 bg-tenu-band-inverted/70 px-1.5 py-0.5 text-[10px] text-tenu-canvas">
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
