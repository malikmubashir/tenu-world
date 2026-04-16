/**
 * Capture device GPS position.
 * Used during photo capture to verify the user is at the property.
 */
export interface CaptureLocation {
  lat: number;
  lng: number;
  accuracyMeters: number;
  timestamp: number;
}

export function captureLocation(timeoutMs = 10000): Promise<CaptureLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyMeters: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        reject(new Error(`Geolocation failed: ${err.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 30000,
      },
    );
  });
}

/**
 * Haversine distance between two lat/lng points in meters.
 * Used to check if photo was taken at the property address.
 */
export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/** Maximum acceptable distance from property (meters) */
export const MAX_DISTANCE_METERS = 500;
