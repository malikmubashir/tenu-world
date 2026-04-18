/**
 * Unified camera API — native Capacitor on device, <input type="file">
 * on the web. Returns a Blob regardless of source so downstream code
 * (hash, EXIF, upload) doesn't branch.
 */
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { isNative } from "./platform";

export interface CapturedPhoto {
  blob: Blob;
  /** Display-only local URL. Revoke with URL.revokeObjectURL when done. */
  previewUrl: string;
  /** MIME type, e.g. image/jpeg. */
  mimeType: string;
  /** File name suggestion. Not guaranteed unique. */
  suggestedName: string;
}

/**
 * Take a photo. Opens the native camera on iOS/Android, falls back to a
 * hidden file-picker on web. Rejects on cancellation.
 */
export async function takePhoto(): Promise<CapturedPhoto> {
  if (isNative()) {
    return takeNativePhoto();
  }
  return takeWebPhoto();
}

/**
 * Pick from the library instead of capturing fresh. Useful for dry-run
 * testing with canned fixtures.
 */
export async function pickFromLibrary(): Promise<CapturedPhoto> {
  if (isNative()) {
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
      correctOrientation: true,
    });
    const blob = base64ToBlob(photo.base64String ?? "", `image/${photo.format}`);
    const previewUrl = URL.createObjectURL(blob);
    return {
      blob,
      previewUrl,
      mimeType: `image/${photo.format}`,
      suggestedName: `photo-${Date.now()}.${photo.format}`,
    };
  }
  return takeWebPhoto(/* allowLibrary */ true);
}

async function takeNativePhoto(): Promise<CapturedPhoto> {
  const photo = await Camera.getPhoto({
    quality: 85,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: CameraSource.Camera,
    correctOrientation: true,
    saveToGallery: false,
  });
  const mimeType = `image/${photo.format}`;
  const blob = base64ToBlob(photo.base64String ?? "", mimeType);
  const previewUrl = URL.createObjectURL(blob);
  return {
    blob,
    previewUrl,
    mimeType,
    suggestedName: `photo-${Date.now()}.${photo.format}`,
  };
}

function takeWebPhoto(allowLibrary = false): Promise<CapturedPhoto> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    if (!allowLibrary) {
      // iOS Safari + Android Chrome honour `capture="environment"` to
      // force the rear camera. Desktop browsers ignore it silently.
      input.setAttribute("capture", "environment");
    }
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error("No file selected"));
        return;
      }
      resolve({
        blob: file,
        previewUrl: URL.createObjectURL(file),
        mimeType: file.type || "image/jpeg",
        suggestedName: file.name || `photo-${Date.now()}.jpg`,
      });
    };
    input.oncancel = () => reject(new Error("Cancelled"));
    input.click();
  });
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

/**
 * Pre-flight permission check. On web this is a no-op — the browser
 * prompts per-capture. On native we ask up-front so users see the
 * in-app rationale before the system dialog.
 */
export async function ensureCameraPermission(): Promise<boolean> {
  if (!isNative()) return true;
  const current = await Camera.checkPermissions();
  if (current.camera === "granted") return true;
  const requested = await Camera.requestPermissions({ permissions: ["camera"] });
  return requested.camera === "granted";
}
