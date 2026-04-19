"use client";

/**
 * Draft detail + per-room photo capture screen.
 *
 * Tap a room → you're in capture mode for that room: big camera CTA,
 * photo grid below, badge counter. Back returns to the room list.
 *
 * Static export + dynamic [id] routes: Next 15 requires a non-empty
 * `generateStaticParams` even for client-routed pages. We emit one
 * placeholder HTML shell at build time so the JS chunk ships; real
 * IDs are reached via client-side router.push() after draft creation
 * (history.pushState — no HTTP fetch, so the missing HTML doesn't
 * matter).
 */
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import NavBar from "@/components/mobile/NavBar";
import HIGButton from "@/components/mobile/HIGButton";
import CameraButton from "@/components/mobile/CameraButton";
import PhotoGrid from "@/components/mobile/PhotoGrid";
import { loadDraft, type InspectionDraft } from "@/lib/mobile/storage/drafts";
import {
  listPhotosForDraft,
  listPhotosForRoom,
  type LocalPhotoRecord,
} from "@/lib/mobile/storage/photos";

export default function InspectionDraftView() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const draftId = params?.id ?? "";

  const [draft, setDraft] = useState<InspectionDraft | null>(null);
  const [allPhotos, setAllPhotos] = useState<LocalPhotoRecord[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [roomPhotos, setRoomPhotos] = useState<LocalPhotoRecord[]>([]);

  const refreshPhotos = useCallback(async () => {
    if (!draftId) return;
    const all = await listPhotosForDraft(draftId);
    setAllPhotos(all);
    if (activeRoom) {
      const roomOnly = await listPhotosForRoom(draftId, activeRoom);
      setRoomPhotos(roomOnly);
    }
  }, [draftId, activeRoom]);

  useEffect(() => {
    if (!draftId) return;
    void loadDraft(draftId).then(setDraft);
    void refreshPhotos();
  }, [draftId, refreshPhotos]);

  useEffect(() => {
    if (activeRoom) void refreshPhotos();
  }, [activeRoom, refreshPhotos]);

  if (!draft) {
    return (
      <>
        <NavBar title="Constat" />
        <div className="p-4 text-sm text-tenu-slate/60">Chargement…</div>
      </>
    );
  }

  const rooms = (draft.payload.rooms as string[]) ?? [];
  const countFor = (room: string) =>
    allPhotos.filter((p) => p.roomId === room).length;

  if (activeRoom) {
    return (
      <>
        <NavBar
          title={labelForRoom(activeRoom)}
          onBack={() => setActiveRoom(null)}
        />
        <div className="flex flex-1 flex-col px-4 pb-8 pt-4">
          <div className="mb-4 rounded-xl bg-white/70 p-3 text-sm text-tenu-slate">
            Cadrez l'angle de la pièce. Minimum 4 photos. Les photos
            restent sur votre téléphone jusqu'à l'envoi final.
          </div>
          <PhotoGrid photos={roomPhotos} />
          <div className="mt-auto flex justify-center py-6">
            <CameraButton
              draftId={draftId}
              roomId={activeRoom}
              onCaptured={() => void refreshPhotos()}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar title="Constat en cours" />
      <div className="flex flex-1 flex-col px-4 pb-8 pt-4">
        <p className="text-sm text-tenu-slate/70">
          {(draft.payload.address as string) ?? "Adresse non renseignée"}
        </p>
        <p className="mb-4 text-xs uppercase tracking-wide text-tenu-slate/50">
          {draft.payload.type === "sortie" ? "Sortie" : "Entrée"}
        </p>

        <ul className="flex flex-col gap-2">
          {rooms.map((r) => (
            <li key={r}>
              <button
                type="button"
                onClick={() => setActiveRoom(r)}
                className="flex w-full items-center justify-between rounded-xl bg-white/70 px-4 py-3 text-left active:bg-white"
              >
                <span className="font-medium text-tenu-slate">
                  {labelForRoom(r)}
                </span>
                <span className="text-sm text-tenu-slate/60">
                  {countFor(r)} photo{countFor(r) > 1 ? "s" : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-8">
          <HIGButton
            onClick={() => router.push(`/app-home/inspection/${draftId}/submit`)}
            disabled={allPhotos.length < 4}
          >
            Vérifier et envoyer
          </HIGButton>
          <p className="mt-2 text-center text-[11px] text-tenu-slate/50">
            {allPhotos.length < 4
              ? `Ajoutez encore ${4 - allPhotos.length} photo(s) avant de continuer.`
              : "Toutes les photos seront envoyées au serveur Tenu."}
          </p>
        </div>
      </div>
    </>
  );
}

const ROOM_LABELS: Record<string, string> = {
  entree: "Entrée",
  salon: "Salon",
  cuisine: "Cuisine",
  chambre: "Chambre",
  chambre_2: "Chambre 2",
  salle_de_bain: "Salle de bain",
  wc: "WC",
  cave: "Cave",
  parking: "Parking",
  balcon: "Balcon",
  terrasse: "Terrasse",
  jardin: "Jardin",
};

function labelForRoom(id: string): string {
  return ROOM_LABELS[id] ?? id;
}
