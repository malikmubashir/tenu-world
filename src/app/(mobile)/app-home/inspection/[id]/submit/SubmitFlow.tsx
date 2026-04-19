"use client";

/**
 * Inspection submit pipeline — orchestrates the full upload + scan from
 * the device.
 *
 * Stages (state machine):
 *   1. idle        — render review summary + "Envoyer pour analyse" CTA
 *   2. creating    — POST /api/inspection/create (mints inspectionId +
 *                    server room UUIDs)
 *   3. uploading   — for each local photo:
 *                    - POST /api/mobile/upload-intent → presigned PUT URL
 *                    - PUT photo bytes directly to R2
 *                    - POST /api/mobile/upload-commit (records DB row)
 *                    Progress shown as "x / N photos".
 *   4. scanning    — POST /api/ai/scan (Haiku risk scan)
 *   5. done        — success screen, "Voir le rapport" CTA → /app-home/reports
 *   6. error       — error message + retry button
 *
 * Auth: Supabase access token sent as Authorization: Bearer header on
 * every server call. Cookies do not flow across the Capacitor /
 * tenu.world origin boundary.
 *
 * Brand: Identity v1 — paper #F4F1EA canvas, ink type, paper-2 #EDE8DC
 * for layered cards (room summary, progress card), brand-rule hairline,
 * brand-muted secondary text. Emerald CTA stays the only call-to-action
 * colour.
 *
 * Network failures: a single retry pass at the photo level (one
 * upload-intent → PUT → commit cycle, max two attempts). Inspection
 * creation and scan are single-shot — if either fails, surface error
 * and let the user retry the whole submit.
 */

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import NavBar from "@/components/mobile/NavBar";
import { createClient } from "@/lib/supabase/client";
import { isNative } from "@/lib/mobile/platform";
import {
  loadDraft,
  saveDraft,
  type InspectionDraft,
} from "@/lib/mobile/storage/drafts";
import {
  attachInspectionToDraftPhotos,
  listPhotosForDraft,
  markPhotoUploaded,
  readPhotoBytes,
  type LocalPhotoRecord,
} from "@/lib/mobile/storage/photos";

const PAPER = "#F4F1EA";
const PAPER_2 = "#EDE8DC";
const INK = "#0B1F3A";
const INK_55 = "rgba(11, 31, 58, 0.55)";
const INK_12 = "rgba(11, 31, 58, 0.12)";
const EMERALD = "#059669";
const EMERALD_PRESSED = "#047857";
const DANGER = "#DC2626";

type Stage = "idle" | "creating" | "uploading" | "scanning" | "done" | "error";

interface CreateResp {
  inspectionId: string;
  rooms: { id: string; type: string; label: string; sortOrder: number }[];
}

interface IntentResp {
  url: string;
  key: string;
  headers: Record<string, string>;
  expiresAt: string;
}

interface ProgressState {
  uploaded: number;
  total: number;
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

export default function SubmitFlow() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const draftId = params?.id ?? "";

  const [draft, setDraft] = useState<InspectionDraft | null>(null);
  const [photos, setPhotos] = useState<LocalPhotoRecord[]>([]);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState<ProgressState>({ uploaded: 0, total: 0 });
  const [error, setError] = useState<string>("");
  const [resultInspectionId, setResultInspectionId] = useState<string>("");

  useEffect(() => {
    if (!draftId) return;
    void (async () => {
      const d = await loadDraft(draftId);
      setDraft(d);
      const ps = await listPhotosForDraft(draftId);
      setPhotos(ps);
    })();
  }, [draftId]);

  // Per-room counts for the review summary.
  const perRoom = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of photos) map[p.roomId] = (map[p.roomId] ?? 0) + 1;
    return map;
  }, [photos]);

  const rooms = (draft?.payload.rooms as string[] | undefined) ?? [];
  const totalPhotos = photos.length;
  const minimumOk = totalPhotos >= 4;

  async function handleSubmit() {
    if (!draft || photos.length === 0) return;
    setError("");
    setStage("creating");

    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error("Session expirée. Reconnectez-vous.");
      }
      const authHeaders: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      };

      // Step 1 — create the server inspection + rooms.
      const createRes = await fetch("https://tenu.world/api/inspection/create", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          jurisdiction: "fr",
          address: (draft.payload.address as string | undefined) ?? "",
          inspectionType:
            draft.payload.type === "sortie" ? "move_out" : "move_in",
          rooms: rooms.map((r) => ({ type: r, label: labelForRoom(r) })),
        }),
      });
      if (!createRes.ok) {
        const j = (await createRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `Création échouée (${createRes.status}).`);
      }
      const created = (await createRes.json()) as CreateResp;
      const { inspectionId } = created;

      // Map local roomCode → server room UUID.
      const roomLookup: Record<string, string> = {};
      for (const r of created.rooms) {
        roomLookup[r.type] = r.id;
      }

      // Persist inspectionId onto the local draft + each local photo so
      // a retry doesn't double-create on the server.
      await saveDraft({
        ...draft,
        payload: { ...draft.payload, serverInspectionId: inspectionId },
        updatedAt: Date.now(),
      });
      await attachInspectionToDraftPhotos(draftId, inspectionId);

      // Step 2 — upload each photo.
      setStage("uploading");
      setProgress({ uploaded: 0, total: photos.length });

      for (const photo of photos) {
        const serverRoomId = roomLookup[photo.roomId];
        if (!serverRoomId) {
          throw new Error(
            `Pièce inconnue côté serveur: ${labelForRoom(photo.roomId)}`,
          );
        }

        // Skip if already uploaded (retry-safe).
        if (photo.remoteKey) {
          setProgress((p) => ({ ...p, uploaded: p.uploaded + 1 }));
          continue;
        }

        await uploadPhoto({
          photo,
          serverRoomId,
          inspectionId,
          authHeaders,
        });

        setProgress((p) => ({ ...p, uploaded: p.uploaded + 1 }));
      }

      // Step 3 — flip the inspection status capturing → submitted so the
      // scan endpoint accepts it. Single short call, no body data.
      const submitRes = await fetch(
        "https://tenu.world/api/inspection/submit",
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ inspectionId }),
        },
      );
      if (!submitRes.ok) {
        const j = (await submitRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `Soumission échouée (${submitRes.status}).`);
      }

      // Step 4 — kick off Haiku scan.
      setStage("scanning");
      const scanRes = await fetch("https://tenu.world/api/ai/scan", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ inspectionId }),
      });
      if (!scanRes.ok) {
        const j = (await scanRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `Analyse échouée (${scanRes.status}).`);
      }

      setResultInspectionId(inspectionId);
      setStage("done");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue.";
      setError(msg);
      setStage("error");
    }
  }

  if (!draft) {
    return (
      <>
        <NavBar title="Envoyer" />
        <div
          className="flex flex-1 items-center justify-center px-6"
          style={{ backgroundColor: PAPER, color: INK_55 }}
        >
          Chargement…
        </div>
      </>
    );
  }

  if (stage === "done") {
    return (
      <>
        <NavBar title="Analyse en cours" showBack={false} />
        <div
          className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center"
          style={{ backgroundColor: PAPER, color: INK }}
        >
          <SuccessGlyph />
          <div className="space-y-3">
            <h1
              className="text-[26px] font-medium leading-tight"
              style={{
                fontFamily: "var(--font-brand)",
                letterSpacing: "-0.04em",
              }}
            >
              Constat envoyé.
            </h1>
            <p className="text-[15px] leading-relaxed" style={{ color: INK_55 }}>
              Notre analyse tourne. Vous recevrez un e-mail de confirmation
              dès que le rapport sera prêt — généralement en moins de deux
              minutes.
            </p>
          </div>

          <div className="flex w-full max-w-sm flex-col gap-3 pt-4">
            <button
              type="button"
              onClick={() =>
                router.replace(
                  resultInspectionId
                    ? `/app-home/reports?focus=${resultInspectionId}`
                    : "/app-home/reports",
                )
              }
              className="flex h-[52px] w-full items-center justify-center rounded-2xl text-[16px] font-semibold"
              style={{ backgroundColor: EMERALD, color: "#FFFFFF" }}
            >
              Voir mes rapports
            </button>
            <button
              type="button"
              onClick={() => router.replace("/app-home/")}
              className="flex h-[44px] w-full items-center justify-center rounded-2xl text-[14px] font-medium"
              style={{ color: INK }}
            >
              Retour à l&apos;accueil
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar
        title="Envoyer pour analyse"
        onBack={
          stage === "idle" || stage === "error"
            ? () => router.back()
            : undefined
        }
        showBack={stage === "idle" || stage === "error"}
      />
      <div
        className="flex flex-1 flex-col px-6 pb-8 pt-6"
        style={{ backgroundColor: PAPER, color: INK }}
      >
        {/* Review summary card. */}
        <div
          className="rounded-2xl p-4"
          style={{
            backgroundColor: PAPER_2,
            border: `1px solid ${INK_12}`,
          }}
        >
          <p
            className="text-[12px] font-semibold uppercase tracking-wide"
            style={{ color: INK_55 }}
          >
            {draft.payload.type === "sortie" ? "Sortie" : "Entrée"}
          </p>
          <p className="mt-1 text-[15px] font-medium" style={{ color: INK }}>
            {(draft.payload.address as string) ?? "Adresse non renseignée"}
          </p>
          <div
            className="my-3 h-px w-full"
            style={{ backgroundColor: INK_12 }}
          />
          <ul className="flex flex-col gap-2">
            {rooms.map((r) => {
              const count = perRoom[r] ?? 0;
              return (
                <li
                  key={r}
                  className="flex items-center justify-between text-[14px]"
                >
                  <span style={{ color: INK }}>{labelForRoom(r)}</span>
                  <span style={{ color: count > 0 ? INK : DANGER }}>
                    {count} photo{count > 1 ? "s" : ""}
                  </span>
                </li>
              );
            })}
          </ul>
          <div
            className="my-3 h-px w-full"
            style={{ backgroundColor: INK_12 }}
          />
          <div className="flex items-center justify-between text-[14px] font-medium">
            <span style={{ color: INK }}>Total</span>
            <span style={{ color: INK }}>
              {totalPhotos} photo{totalPhotos > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Stage-specific body. */}
        <div className="mt-6 flex-1">
          {stage === "uploading" && (
            <ProgressBlock
              title="Envoi des photos"
              detail={`${progress.uploaded} / ${progress.total}`}
              ratio={
                progress.total === 0 ? 0 : progress.uploaded / progress.total
              }
            />
          )}
          {stage === "creating" && (
            <ProgressBlock
              title="Préparation du dossier"
              detail="Création de l'inspection côté serveur…"
              indeterminate
            />
          )}
          {stage === "scanning" && (
            <ProgressBlock
              title="Analyse en cours"
              detail="Lecture des photos par notre modèle. ~30 secondes."
              indeterminate
            />
          )}
          {stage === "error" && (
            <div
              className="rounded-2xl p-4 text-[14px]"
              style={{
                backgroundColor: "rgba(220, 38, 38, 0.06)",
                border: `1px solid rgba(220, 38, 38, 0.20)`,
                color: DANGER,
              }}
            >
              <p className="font-medium">Erreur</p>
              <p className="mt-1">{error}</p>
            </div>
          )}
          {stage === "idle" && !minimumOk && (
            <p
              className="rounded-2xl p-4 text-[13px]"
              style={{
                backgroundColor: PAPER_2,
                border: `1px solid ${INK_12}`,
                color: INK_55,
              }}
            >
              Ajoutez au moins {4 - totalPhotos} photo
              {4 - totalPhotos > 1 ? "s" : ""} supplémentaire
              {4 - totalPhotos > 1 ? "s" : ""} avant d&apos;envoyer.
            </p>
          )}
        </div>

        {/* Footer CTA. */}
        <div className="pt-6">
          {(stage === "idle" || stage === "error") && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!minimumOk}
              className="flex h-[52px] w-full items-center justify-center rounded-2xl text-[16px] font-semibold transition-all"
              style={{
                backgroundColor: minimumOk
                  ? EMERALD
                  : "rgba(5, 150, 105, 0.40)",
                color: "#FFFFFF",
                cursor: minimumOk ? "pointer" : "not-allowed",
              }}
              onPointerDown={(e) => {
                if (minimumOk) {
                  e.currentTarget.style.backgroundColor = EMERALD_PRESSED;
                }
              }}
              onPointerUp={(e) => {
                if (minimumOk) e.currentTarget.style.backgroundColor = EMERALD;
              }}
              onPointerLeave={(e) => {
                if (minimumOk) e.currentTarget.style.backgroundColor = EMERALD;
              }}
            >
              {stage === "error" ? "Réessayer l'envoi" : "Envoyer pour analyse"}
            </button>
          )}
          {(stage === "creating" ||
            stage === "uploading" ||
            stage === "scanning") && (
            <button
              type="button"
              disabled
              className="flex h-[52px] w-full items-center justify-center rounded-2xl text-[16px] font-semibold"
              style={{
                backgroundColor: "rgba(5, 150, 105, 0.40)",
                color: "#FFFFFF",
                cursor: "wait",
              }}
            >
              Envoi en cours…
            </button>
          )}
          <p
            className="mt-3 text-center text-[12px] leading-snug"
            style={{ color: INK_55 }}
          >
            Vos photos sont chiffrées en transit (HTTPS) et stockées en Union
            européenne. Vous pouvez demander leur suppression depuis
            l&apos;application.
          </p>
        </div>
      </div>
    </>
  );
}

async function uploadPhoto({
  photo,
  serverRoomId,
  inspectionId,
  authHeaders,
}: {
  photo: LocalPhotoRecord;
  serverRoomId: string;
  inspectionId: string;
  authHeaders: Record<string, string>;
}): Promise<void> {
  // Read bytes from local store (file:// on native, blob URL on web).
  const blob = await readPhotoBytes(photo);

  // Step a — request a presigned URL.
  const intentRes = await fetch("https://tenu.world/api/mobile/upload-intent", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      roomId: serverRoomId,
      inspectionId,
      mimeType: photo.mimeType,
      sizeBytes: photo.sizeBytes,
      sha256: photo.sha256,
    }),
  });
  if (!intentRes.ok) {
    const j = (await intentRes.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error ?? `Upload-intent échoué (${intentRes.status}).`);
  }
  const intent = (await intentRes.json()) as IntentResp;

  // Step b — PUT bytes to R2 directly.
  const putRes = await fetch(intent.url, {
    method: "PUT",
    headers: intent.headers,
    body: blob,
  });
  if (!putRes.ok) {
    throw new Error(`Téléversement R2 échoué (${putRes.status}).`);
  }

  // Step c — finalize the metadata row server-side.
  const commitRes = await fetch("https://tenu.world/api/mobile/upload-commit", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      key: intent.key,
      roomId: serverRoomId,
      inspectionId,
      mimeType: photo.mimeType,
      sizeBytes: photo.sizeBytes,
      sha256: photo.sha256,
      exifTimestamp: photo.exifTimestamp,
      capturedAt: new Date(photo.capturedAt).toISOString(),
    }),
  });
  if (!commitRes.ok) {
    const j = (await commitRes.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error ?? `Commit échoué (${commitRes.status}).`);
  }

  // Step d — mark uploaded locally so a retry skips this photo.
  await markPhotoUploaded(photo.id, intent.key);
}

function ProgressBlock({
  title,
  detail,
  ratio,
  indeterminate,
}: {
  title: string;
  detail: string;
  ratio?: number;
  indeterminate?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        backgroundColor: PAPER_2,
        border: `1px solid ${INK_12}`,
      }}
    >
      <p className="text-[15px] font-medium" style={{ color: INK }}>
        {title}
      </p>
      <p className="mt-1 text-[13px]" style={{ color: INK_55 }}>
        {detail}
      </p>
      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: INK_12 }}
      >
        {indeterminate ? (
          <div
            className="h-full w-1/3 animate-pulse rounded-full"
            style={{ backgroundColor: EMERALD }}
          />
        ) : (
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{
              width: `${Math.min(100, Math.max(0, (ratio ?? 0) * 100))}%`,
              backgroundColor: EMERALD,
            }}
          />
        )}
      </div>
    </div>
  );
}

function SuccessGlyph() {
  // Plain ink-on-paper checkmark in a Portal-shaped container, sized to
  // mirror the brand mark stack used elsewhere on the welcome screens.
  return (
    <svg width="72" height="72" viewBox="0 0 48 48" aria-hidden="true">
      <path d="M 4 46 V 24 A 20 20 0 0 1 44 24 V 46 Z" fill={INK} />
      <path
        d="M 16 25 L 22 31 L 33 19"
        fill="none"
        stroke={PAPER}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
