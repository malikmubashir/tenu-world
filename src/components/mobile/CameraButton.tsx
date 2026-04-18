"use client";

/**
 * Circular camera CTA — iOS 26 camera-app style. 72pt diameter, centered
 * on the photo screen. Calls through to the mobile camera wrapper and
 * hashes + persists the result.
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
      className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-tenu-forest text-tenu-cream shadow-lg active:opacity-75 disabled:opacity-40"
    >
      <Camera className="h-8 w-8" />
    </button>
  );
}
