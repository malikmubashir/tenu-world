"use client";

/**
 * Camera shutter — primary capture action. Éditorial v2 (#T150):
 * APPROVED EXCEPTION surface — filled black (--color-tenu-cta), white
 * glyph, 0px radius, no shadow. 72pt square keeps the large HIG
 * target. Calls through to the mobile camera wrapper and hashes +
 * persists the result.
 */
import { useState } from "react";
import { Camera } from "lucide-react";
import { takePhoto, ensureCameraPermission, CameraPermissionError } from "@/lib/mobile/camera";
import { hashPhoto } from "@/lib/photo/hash";
import { savePhotoLocally } from "@/lib/mobile/storage/photos";
import { hapticMedium, hapticError } from "@/lib/mobile/haptics";

interface CameraButtonProps {
  draftId: string;
  roomId: string;
  onCaptured?: () => void;
  disabled?: boolean;
}

export default function CameraButton({
  draftId,
  roomId,
  onCaptured,
  disabled,
}: CameraButtonProps) {
  const [busy, setBusy] = useState(false);

  const handlePress = async () => {
    if (busy || disabled) return;
    setBusy(true);
    try {
      const ok = await ensureCameraPermission();
      if (!ok) {
        void hapticError();
        alert("Autorisation caméra refusée. Activez-la dans Réglages.");
        return;
      }
      const photo = await takePhoto();
      if (!photo) {
        // User cancelled — no-op, no haptic.
        return;
      }
      const bytes = await photo.blob.arrayBuffer();
      const sha256 = await hashPhoto(bytes);
      // EXIF parsing is server-side today (exifr is Node-first). We
      // leave exif_timestamp null here; the server re-parses on commit.
      await savePhotoLocally(draftId, roomId, photo, sha256, null);
      void hapticMedium();
      onCaptured?.();
    } catch (err) {
      void hapticError();
      if (err instanceof CameraPermissionError) {
        alert("Autorisation caméra refusée. Activez-la dans Réglages.");
      } else {
        console.error("[camera] capture failed:", err);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      aria-label="Prendre une photo"
      onClick={handlePress}
      disabled={busy || disabled}
      aria-busy={busy}
      className="hig-press flex h-[72px] w-[72px] items-center justify-center rounded-none bg-tenu-cta text-tenu-cta-text active:opacity-75 disabled:opacity-40"
    >
      {/* Spinner while the native camera / hash / persist round-trip
          runs, so a second tap is visibly pointless. */}
      {busy ? (
        <span
          className="h-7 w-7 animate-spin rounded-full border-[3px] border-tenu-cta-text/30 border-t-tenu-cta-text motion-reduce:animate-none"
          aria-hidden="true"
        />
      ) : (
        <Camera className="h-8 w-8" />
      )}
    </button>
  );
}
