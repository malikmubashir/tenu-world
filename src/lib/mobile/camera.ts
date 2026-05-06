/**
 * Unified camera API — native Capacitor on device, <input type="file">
 * on the web. Returns a Blob regardless of source so downstream code
 * (hash, EXIF, upload) doesn't branch.
 *
 * Cancellation is not an error: takePhoto() and pickFromLibrary()
 * resolve to null when the user cancels. Permission denial throws
 * CameraPermissionError so the UI can route to Settings.
 */
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { isNative } from "./platform";

// NotReadableError: camera hardware temporarily claimed by another app or
// process (common on Android mid-capture). Retry up to twice with backoff.
function isCameraBusy(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  const name = err instanceof DOMException ? err.name : "";
  return (
    name === "NotReadableError" ||
    /NotReadableError|camera.*busy|device.*in use|overconstrained/i.test(msg)
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export interface CapturedPhoto {
  blob: Blob;
  /** Display-only local URL. Revoke with URL.revokeObjectURL when done. */
  previewUrl: string;
  /** MIME type, e.g. image/jpeg. */
  mimeType: string;
  /** File name suggestion. Not guaranteed unique. */
  suggestedName: string;
}

export class CameraPermissionError extends Error {
  constructor(message = "Camera permission denied") {
    super(message);
    this.name = "CameraPermissionError";
  }
}

// Capacitor throws strings like "User cancelled photos app" when the user
// dismisses the camera sheet. Classify those as cancellations.
function isCancellation(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return /cancel/i.test(msg);
}

/**
 * Take a photo. Opens the native camera on iOS/Android, falls back to a
 * hidden file-picker on web. Returns null if the user cancels. Throws
 * CameraPermissionError on denial.
 */
export async function takePhoto(): Promise<CapturedPhoto | null> {
  if (isNative()) {
    return takeNativePhoto(CameraSource.Camera);
  }
  return takeWebPhoto();
}

/**
 * Pick from the library instead of capturing fresh. Useful for dry-run
 * testing with canned fixtures.
 */
export async function pickFromLibrary(): Promise<CapturedPhoto | null> {
  if (isNative()) {
    return takeNativePhoto(CameraSource.Photos);
  }
  return takeWebPhoto(/* allowLibrary */ true);
}

async function takeNativePhoto(
  source: CameraSource,
): Promise<CapturedPhoto | null> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(500 * attempt); // 500ms then 1000ms
    let photo;
    try {
      photo = await Camera.getPhoto({
        source,
        resultType: CameraResultType.Uri,
        // 75 quality is the brief-spec ceiling that keeps Haiku input
        // well under 512 KB per image after JPEG encode. 1600px max
        // edge preserves text legibility for compteurs/serrures and
        // stays under Capacitor's 5 MB in-memory photo limit on low-end
        // Android devices.
        quality: 75,
        width: 1600,
        correctOrientation: true,
        saveToGallery: false,
        allowEditing: false,
      });
    } catch (err) {
      if (isCancellation(err)) return null;
      // Capacitor wraps OS permission denials in errors whose messages
      // include "denied" or "User denied access". Treat explicitly.
      const msg = err instanceof Error ? err.message : String(err ?? "");
      if (/denied|permission/i.test(msg)) {
        throw new CameraPermissionError(msg);
      }
      // Camera hardware temporarily busy (NotReadableError): retry with backoff.
      if (isCameraBusy(err) && attempt < 2) {
        lastError = err;
        continue;
      }
      throw err;
    }

    const uri = photo.webPath ?? photo.path;
    if (!uri) {
      throw new Error("Camera returned no URI");
    }
    // webPath is a blob:/file: URL the WebView can fetch directly.
    const response = await fetch(uri);
    const blob = await response.blob();
    const mimeType = blob.type || `image/${photo.format ?? "jpeg"}`;
    const format = photo.format ?? (mimeType.split("/")[1] || "jpeg");
    return {
      blob,
      previewUrl: URL.createObjectURL(blob),
      mimeType,
      suggestedName: `photo-${Date.now()}.${format}`,
    };
  }
  throw lastError;
}

function takeWebPhoto(allowLibrary = false): Promise<CapturedPhoto | null> {
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
        resolve(null);
        return;
      }
      resolve({
        blob: file,
        previewUrl: URL.createObjectURL(file),
        mimeType: file.type || "image/jpeg",
        suggestedName: file.name || `photo-${Date.now()}.jpg`,
      });
    };
    // Chrome fires `cancel` on the input when the file dialog is
    // dismissed (M113+). Older browsers simply don't fire change —
    // caller sees a stuck Promise, but that's acceptable UX.
    input.oncancel = () => resolve(null);
    input.onerror = () => reject(new Error("File picker error"));
    input.click();
  });
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
