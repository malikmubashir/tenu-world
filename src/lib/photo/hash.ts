/**
 * Generate SHA-256 hash of photo data.
 * Stored at upload time to prove the photo was not modified after capture.
 * Works in both browser (Web Crypto API) and server (Node crypto).
 */
export async function hashPhoto(data: ArrayBuffer): Promise<string> {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    /* Browser: use Web Crypto API */
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  /* Server: use Node crypto */
  const { createHash } = await import("crypto");
  return createHash("sha256").update(Buffer.from(data)).digest("hex");
}
