"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ProgressStepper from "@/components/ui/ProgressStepper";
import CameraCapture from "@/components/camera/CameraCapture";
import RoomSelector from "@/components/camera/RoomSelector";
import PhotoGrid from "@/components/camera/PhotoGrid";
import ElementRatingPanel from "@/components/inspection/ElementRatingPanel";
import { uploadPhotoToR2 } from "@/lib/storage/r2-upload";
import type { RoomType } from "@/components/camera/RoomSelector";

const steps = [
  { key: "details", label: "Details" },
  { key: "capture", label: "Capture" },
  { key: "review", label: "Review" },
  { key: "report", label: "Report" },
];

interface Room {
  id: string;
  room_type: RoomType;
  label: string | null;
  sort_order: number;
}

interface Photo {
  id: string;
  r2_url: string;
  captured_at: string;
  sort_order: number;
}

export default function CapturePage() {
  const router = useRouter();
  const params = useParams();
  const inspectionId = params.id as string;

  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Record<string, Photo[]>>({});
  const [showCamera, setShowCamera] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const supabase = useMemo(() => createClient(), []);

  const loadRooms = useCallback(async () => {
    const { data } = await supabase
      .from("rooms")
      .select("id, room_type, label, sort_order")
      .eq("inspection_id", inspectionId)
      .order("sort_order");

    if (data && data.length > 0) {
      setRooms(data as Room[]);
      if (!activeRoomId) setActiveRoomId(data[0].id);
    }
  }, [inspectionId, activeRoomId, supabase]);

  const loadPhotos = useCallback(
    async (roomId: string) => {
      const res = await fetch(`/api/photos?roomId=${roomId}`);
      const json = await res.json();
      if (json.photos) {
        setPhotos((prev) => ({ ...prev, [roomId]: json.photos }));
      }
    },
    [],
  );

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (activeRoomId) loadPhotos(activeRoomId);
  }, [activeRoomId, loadPhotos]);

  async function handleCapture(blob: Blob) {
    if (!activeRoomId) return;
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("photo", blob, `photo_${Date.now()}.jpg`);

      const uploadResult = await uploadPhotoToR2(activeRoomId, formData);

      const res = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: activeRoomId,
          inspectionId,
          r2Key: uploadResult.key,
          r2Url: uploadResult.url,
          mimeType: "image/jpeg",
          sizeBytes: uploadResult.sizeBytes,
          sha256Hash: uploadResult.sha256Hash,
          exifTimestamp: uploadResult.exifTimestamp,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save photo");
      }

      await loadPhotos(activeRoomId);
      setShowCamera(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemovePhoto(photoId: string) {
    const res = await fetch(`/api/photos?id=${photoId}`, { method: "DELETE" });
    if (res.ok && activeRoomId) {
      await loadPhotos(activeRoomId);
    }
  }

  const activePhotos = activeRoomId ? photos[activeRoomId] ?? [] : [];
  const totalPhotos = Object.values(photos).reduce((sum, p) => sum + p.length, 0);

  const roomsForSelector = rooms.map((r) => ({
    id: r.id,
    type: r.room_type,
    label: r.label ?? r.room_type,
    photoCount: (photos[r.id] ?? []).length,
  }));

  return (
    <div className="min-h-screen bg-tenu-canvas">
      <header className="flex items-center justify-between border-b border-tenu-hairline bg-tenu-canvas px-6 py-2">
        <Link
          href="/"
          className="hig-press inline-flex min-h-11 items-center text-xl font-medium lowercase tracking-[-0.04em] text-tenu-ink"
          style={{ fontFamily: "var(--font-brand)" }}
        >
          tenu
        </Link>
        <ProgressStepper steps={steps} currentStep="capture" />
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* Room selector */}
        <RoomSelector
          rooms={roomsForSelector}
          activeRoomId={activeRoomId}
          onSelect={(id) => {
            setActiveRoomId(id);
            setShowCamera(false);
          }}
          onAdd={() => {
            /* future: add custom room */
          }}
          labels={{}}
        />

        {/* Camera or photo grid */}
        <div className="mt-4">
          {showCamera ? (
            <div className="space-y-3">
              <CameraCapture
                onCapture={handleCapture}
                onCancel={() => setShowCamera(false)}
              />
              {/* Upload feedback — spinner + label so slow networks read
                  as "working" rather than frozen. */}
              {uploading && (
                <p
                  className="flex items-center justify-center gap-2 text-center text-sm text-tenu-ink-muted"
                  role="status"
                >
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-tenu-hairline border-t-tenu-ink motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  Uploading...
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <PhotoGrid
                photos={activePhotos.map((p) => ({
                  id: p.id,
                  url: p.r2_url,
                  capturedAt: p.captured_at,
                }))}
                onRemove={handleRemovePhoto}
              />

              <button
                onClick={() => setShowCamera(true)}
                className="hig-press w-full rounded-none border border-dashed border-tenu-hairline bg-tenu-canvas px-4 py-6 text-sm font-medium text-tenu-ink hover:border-tenu-ink"
              >
                + Take photo of{" "}
                {rooms.find((r) => r.id === activeRoomId)?.label ??
                  rooms.find((r) => r.id === activeRoomId)?.room_type ??
                  "room"}
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-4 text-center text-sm text-tenu-danger">{error}</p>
        )}

        {/* Element ratings for active room */}
        {activeRoomId && (
          <div className="mt-6">
            <ElementRatingPanel
              roomId={activeRoomId}
              roomType={rooms.find((r) => r.id === activeRoomId)?.room_type ?? "other"}
            />
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <Link
            href={`/inspection/new`}
            className="hig-press inline-flex min-h-11 items-center rounded-none px-2 text-sm text-tenu-ink-muted underline decoration-1 underline-offset-4 hover:text-tenu-accent"
          >
            Back to details
          </Link>
          <button
            onClick={() => router.push(`/inspection/${inspectionId}/review`)}
            disabled={totalPhotos === 0}
            className="hig-press min-h-11 rounded-none bg-tenu-cta px-6 py-3 text-sm font-medium text-tenu-cta-text hover:opacity-90 disabled:opacity-50"
          >
            Review photos ({totalPhotos})
          </button>
        </div>
      </main>
    </div>
  );
}
