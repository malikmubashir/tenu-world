"use client";

/**
 * PhotoGrid (web capture flow) — thumbnails for the active room with a
 * per-photo remove control and capture timestamp.
 *
 * The remove button is always visible on touch viewports (no hover
 * exists there) and hover/focus-revealed from the sm: breakpoint up.
 * Logical inset properties keep the overlay corners correct in RTL.
 */
import { X } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  capturedAt: string;
}

interface PhotoGridProps {
  photos: Photo[];
  onRemove: (photoId: string) => void;
}

export default function PhotoGrid({ photos, onRemove }: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-tenu-cream-dark">
        <p className="text-sm text-tenu-slate/50">No photos yet. Tap the camera to start.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {photos.map((photo) => (
        <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.url}
            alt={`Inspection photo, captured ${new Date(photo.capturedAt).toLocaleTimeString()}`}
            className="h-full w-full object-cover"
          />
          <button
            onClick={() => onRemove(photo.id)}
            aria-label="Remove photo"
            className="hig-press absolute end-1 top-1 rounded-full bg-black/50 p-2 text-white opacity-100 transition-opacity duration-150 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="absolute inset-x-0 bottom-0 bg-black/40 px-1.5 py-0.5 text-[9px] text-white">
            {new Date(photo.capturedAt).toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  );
}
