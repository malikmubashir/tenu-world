"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ProgressStepper from "@/components/ui/ProgressStepper";
import PhotoGrid from "@/components/camera/PhotoGrid";
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
}

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams();
  const inspectionId = params.id as string;

  const [rooms, setRooms] = useState<Room[]>([]);
  const [photosByRoom, setPhotosByRoom] = useState<Record<string, Photo[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const supabase = useMemo(() => createClient(), []);

  const loadData = useCallback(async () => {
    // load rooms
    const { data: roomData } = await supabase
      .from("rooms")
      .select("id, room_type, label, sort_order")
      .eq("inspection_id", inspectionId)
      .order("sort_order");

    if (!roomData) return;
    setRooms(roomData as Room[]);

    // load photos for each room
    const grouped: Record<string, Photo[]> = {};
    for (const room of roomData) {
      const res = await fetch(`/api/photos?roomId=${room.id}`);
      const json = await res.json();
      grouped[room.id] = json.photos ?? [];
    }
    setPhotosByRoom(grouped);
  }, [inspectionId, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleRemovePhoto(photoId: string) {
    const res = await fetch(`/api/photos?id=${photoId}`, { method: "DELETE" });
    if (res.ok) await loadData();
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/inspection/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inspectionId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");

      router.push(`/inspection/${inspectionId}/report`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  const totalPhotos = Object.values(photosByRoom).reduce(
    (sum, p) => sum + p.length,
    0,
  );

  return (
    <div className="min-h-screen bg-tenu-cream">
      <header className="flex items-center justify-between border-b border-tenu-cream-dark bg-white px-6 py-4">
        <Link href="/" className="text-xl font-bold text-tenu-forest">
          tenu
        </Link>
        <ProgressStepper steps={steps} currentStep="review" />
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-2 text-2xl font-bold text-tenu-forest">
          Review your photos
        </h1>
        <p className="mb-6 text-sm text-tenu-slate/70">
          {totalPhotos} photo{totalPhotos !== 1 ? "s" : ""} across{" "}
          {rooms.length} room{rooms.length !== 1 ? "s" : ""}. Remove any you
          don&apos;t want included.
        </p>

        {rooms.map((room) => {
          const roomPhotos = photosByRoom[room.id] ?? [];
          if (roomPhotos.length === 0) return null;

          return (
            <div key={room.id} className="mb-6">
              <h2 className="mb-2 text-sm font-semibold text-tenu-forest">
                {room.label ?? room.room_type} ({roomPhotos.length})
              </h2>
              <PhotoGrid
                photos={roomPhotos.map((p) => ({
                  id: p.id,
                  url: p.r2_url,
                  capturedAt: p.captured_at,
                }))}
                onRemove={handleRemovePhoto}
              />
            </div>
          );
        })}

        {totalPhotos === 0 && (
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-tenu-cream-dark">
            <p className="text-sm text-tenu-slate/50">
              No photos captured yet.
            </p>
          </div>
        )}

        {error && (
          <p className="mt-4 text-center text-sm text-tenu-danger">{error}</p>
        )}

        <div className="mt-8 flex items-center justify-between">
          <Link
            href={`/inspection/${inspectionId}/capture`}
            className="text-sm text-tenu-slate/60 hover:text-tenu-forest"
          >
            Back to capture
          </Link>
          <button
            onClick={handleSubmit}
            disabled={submitting || totalPhotos === 0}
            className="rounded-lg bg-tenu-forest px-6 py-3 text-sm font-medium text-white hover:bg-tenu-forest-light disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit for AI scan"}
          </button>
        </div>
      </main>
    </div>
  );
}
