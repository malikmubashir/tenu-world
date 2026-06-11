"use client";

/**
 * Inspection submit pipeline — orchestrates upload, payment handoff and
 * scan from the device.
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
 *   4. payment     — #T156: the scan is payment-gated (#T145). Price
 *                    preview (GET /api/checkout) + L221-28 1° waiver
 *                    checkboxes (same constants as web — never
 *                    paraphrased), then POST /api/checkout with the
 *                    Bearer token. The returned Stripe URL is opened in
 *                    the system browser surface (@capacitor/browser —
 *                    SFSafariViewController / Chrome Custom Tab, never
 *                    an in-app webview, per the DMA external-purchase
 *                    strategy). Stripe Checkout needs no Tenu session.
 *   5. awaiting    — poll inspections.status via the authenticated
 *                    Supabase client (the Stripe webhook flips it to
 *                    'paid'), 5s base with backoff + manual check.
 *   6. scanning    — POST /api/ai/scan (Haiku risk scan)
 *   7. done        — success screen, "Voir le rapport" CTA → /app-home/reports
 *   8. error       — error message + retry button
 *
 * Auth: Supabase access token sent as Authorization: Bearer header on
 * every server call. Cookies do not flow across the Capacitor /
 * tenu.world origin boundary — which is also why the external browser
 * is anonymous: the Stripe success_url lands on the public
 * payment-return page (?from=app) telling the user to come back here.
 *
 * Brand: Éditorial v2 (#T150) — white canvas, black ink, hairline
 * #e5e7eb frames as the only structure, 0px radius, no shadows. The
 * primary submit action is the APPROVED EXCEPTION: filled
 * (--color-tenu-cta) with white text.
 *
 * Network failures: a single retry pass at the photo level (one
 * upload-intent → PUT → commit cycle, max two attempts). Inspection
 * creation is single-shot — if it fails, surface error and let the user
 * retry the whole submit. After payment, a failed scan never auto-loops
 * (each run costs real Anthropic spend): the user retries via the
 * manual check button.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import NavBar from "@/components/mobile/NavBar";
import { createClient } from "@/lib/supabase/client";
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
import { openStripeCheckout } from "@/lib/mobile/checkout";
import {
  appPaymentReturnUrls,
  classifyPolledStatus,
  nextPollDelayMs,
  scanProductForDraftType,
} from "@/lib/mobile/payment";
import WithdrawalWaiver, {
  type WaiverState,
} from "@/components/legal/WithdrawalWaiver";
import { WAIVER_TEXT_VERSION } from "@/lib/legal/withdrawal-waiver";


type Stage =
  | "idle"
  | "creating"
  | "uploading"
  | "payment"
  | "awaiting"
  | "scanning"
  | "done"
  | "error";

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

/** Slice of the /api/checkout GET price preview the screen needs. */
interface PricePreview {
  tierLabel: string;
  totalReportPrice: number; // cents
  exitOnlyPrice: number; // cents
}

/**
 * Fresh Bearer headers for every server call. Fetched per-call (not
 * cached) because the payment detour can take minutes and the Supabase
 * client refreshes the access token in the background.
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    throw new Error("Session expirée. Reconnectez-vous.");
  }
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

/** Cents → "15,00 €" (FR display, TTC). */
function formatEur(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
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

  // ── #T156 payment handoff state ──────────────────────────────────
  const [inspectionId, setInspectionId] = useState<string>("");
  const [waiver, setWaiver] = useState<WaiverState>({
    priorConsent: false,
    waiver: false,
  });
  const [pricing, setPricing] = useState<PricePreview | null>(null);
  const [payNotice, setPayNotice] = useState<string>("");
  const [payBusy, setPayBusy] = useState(false);
  const [stripeUrl, setStripeUrl] = useState<string>("");
  // Bumping this restarts the awaiting-payment poll loop (manual check).
  const [pollTick, setPollTick] = useState(0);
  // Guards: never two concurrent scan POSTs; never auto-retry a failed
  // scan from the poll loop (each run costs real Anthropic spend).
  const scanInFlightRef = useRef(false);
  const autoScanBlockedRef = useRef(false);

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
      const authHeaders = await getAuthHeaders();

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

      // Step 4 — #T156 payment handoff. The scan endpoint rejects unpaid
      // inspections with 402 (#T145), so instead of POSTing /api/ai/scan
      // directly we move to the consent + payment screen.
      setInspectionId(inspectionId);
      setWaiver({ priorConsent: false, waiver: false });
      setPayNotice("");
      setStage("payment");
      void loadPricing(inspectionId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue.";
      setError(msg);
      setStage("error");
    }
  }

  /**
   * Best-effort price preview (GET /api/checkout). The CTA falls back to
   * neutral copy if this fails — the authoritative price is computed
   * server-side at session creation either way.
   */
  async function loadPricing(id: string) {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `https://tenu.world/api/checkout?inspectionId=${encodeURIComponent(id)}`,
        { headers },
      );
      if (!res.ok) return;
      const j = (await res.json()) as { pricing?: PricePreview };
      if (j.pricing) setPricing(j.pricing);
    } catch {
      // Preview only — ignore.
    }
  }

  const product = scanProductForDraftType(
    draft?.payload.type as string | undefined,
  );
  const priceCents = pricing
    ? product === "exit_only"
      ? pricing.exitOnlyPrice
      : pricing.totalReportPrice
    : null;

  /**
   * Creates the Stripe Checkout session via the app's authenticated API
   * call, then opens the session URL in the system browser surface.
   * Stripe Checkout needs no Tenu session — only the URL — and the
   * success_url returns to the public payment-return page on tenu.world.
   */
  async function startPayment() {
    if (!inspectionId || !waiver.priorConsent || !waiver.waiver || payBusy) {
      return;
    }
    setPayBusy(true);
    setPayNotice("");
    try {
      const headers = await getAuthHeaders();
      const { successUrl, cancelUrl } = appPaymentReturnUrls(inspectionId);
      const res = await fetch("https://tenu.world/api/checkout", {
        method: "POST",
        headers,
        body: JSON.stringify({
          product,
          inspectionId,
          successUrl,
          cancelUrl,
          // EXACT legal constants from src/lib/legal/withdrawal-waiver.ts —
          // the server refuses session creation without both booleans and
          // the current text version (art. L221-28 1° CConso).
          waiverConsent: {
            priorConsent: waiver.priorConsent,
            waiver: waiver.waiver,
            locale: "fr" as const,
            textVersion: WAIVER_TEXT_VERSION,
          },
        }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !j.url) {
        throw new Error(j.error ?? `Paiement indisponible (${res.status}).`);
      }
      setStripeUrl(j.url);
      setStage("awaiting");
      await openStripeCheckout(j.url, {
        inspectionId,
        // Browser dismissed → check the payment immediately.
        onClose: () => setPollTick((t) => t + 1),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue.";
      setPayNotice(msg);
    } finally {
      setPayBusy(false);
    }
  }

  /**
   * Fires the Haiku scan once payment is confirmed. 409 means another
   * surface beat us to it (web report page, double-poll): ALREADY_SCANNED
   * is success, SCAN_IN_PROGRESS goes back to polling. Any other failure
   * returns to the awaiting screen — the payment is already made, so the
   * user retries via the manual check button, never the full submit.
   */
  const runScan = useCallback(async (id: string) => {
    if (scanInFlightRef.current) return;
    scanInFlightRef.current = true;
    setStage("scanning");
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("https://tenu.world/api/ai/scan", {
        method: "POST",
        headers,
        body: JSON.stringify({ inspectionId: id }),
      });
      if (res.ok) {
        setResultInspectionId(id);
        setStage("done");
        return;
      }
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };
      if (res.status === 409 && j.code === "ALREADY_SCANNED") {
        setResultInspectionId(id);
        setStage("done");
        return;
      }
      if (res.status === 409) {
        // SCAN_IN_PROGRESS — keep polling until it lands.
        setStage("awaiting");
        return;
      }
      throw new Error(j.error ?? `Analyse échouée (${res.status}).`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue.";
      autoScanBlockedRef.current = true; // no auto-retry loop on paid spend
      setPayNotice(msg);
      setStage("awaiting");
    } finally {
      scanInFlightRef.current = false;
    }
  }, []);

  // ── Awaiting-payment poll loop ────────────────────────────────────
  // The Stripe webhook flips inspections.status to 'paid'; we read it
  // through the authenticated Supabase client (RLS: owner-only). Backoff
  // 5s → 30s; pollTick restarts the loop (manual check / browser close).
  useEffect(() => {
    if (stage !== "awaiting" || !inspectionId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    const supabase = createClient();

    async function check() {
      if (cancelled) return;
      const { data } = await supabase
        .from("inspections")
        .select("status")
        .eq("id", inspectionId)
        .maybeSingle();
      if (cancelled) return;

      const outcome = classifyPolledStatus(
        (data as { status?: string } | null)?.status,
      );
      if (outcome === "scan_done") {
        setResultInspectionId(inspectionId);
        setStage("done");
        return;
      }
      if (outcome === "run_scan" && !autoScanBlockedRef.current) {
        void runScan(inspectionId);
        return;
      }
      // keep_waiting / scan_in_progress / blocked auto-scan → poll again.
      timer = setTimeout(() => void check(), nextPollDelayMs(attempt++));
    }

    void check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [stage, inspectionId, pollTick, runScan]);

  /** Manual check: clears the auto-scan block and restarts the loop. */
  function checkPaymentNow() {
    autoScanBlockedRef.current = false;
    setPayNotice("");
    setPollTick((t) => t + 1);
  }

  if (!draft) {
    return (
      <>
        <NavBar title="Envoyer" />
        <div className="flex flex-1 items-center justify-center bg-tenu-canvas px-6 text-tenu-ink-muted">
          Chargement…
        </div>
      </>
    );
  }

  if (stage === "done") {
    return (
      <>
        <NavBar title="Analyse en cours" showBack={false} />
        <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-tenu-canvas px-6 text-center text-tenu-ink">
          <SuccessGlyph />
          <div className="space-y-3">
            <h1 className="text-3xl font-light leading-tight tracking-[-0.025em] text-tenu-ink">
              Constat envoyé.
            </h1>
            <p className="text-[15px] leading-relaxed text-tenu-ink-muted">
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
              className="hig-press flex h-[52px] w-full items-center justify-center rounded-none bg-tenu-cta text-[16px] font-medium text-tenu-cta-text"
            >
              Voir mes rapports
            </button>
            <button
              type="button"
              onClick={() => router.replace("/app-home/")}
              className="hig-press flex h-[44px] w-full items-center justify-center rounded-none text-[14px] font-medium text-tenu-ink underline decoration-1 underline-offset-4"
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
      <div className="flex flex-1 flex-col bg-tenu-canvas px-6 pb-8 pt-6 text-tenu-ink">
        {/* Review summary card. */}
        <div className="border border-tenu-hairline bg-tenu-canvas p-4">
          <p className="text-[12px] font-medium text-tenu-ink-muted">
            {draft.payload.type === "sortie" ? "Sortie" : "Entrée"}
          </p>
          <p className="mt-1 text-[15px] font-medium text-tenu-ink">
            {(draft.payload.address as string) ?? "Adresse non renseignée"}
          </p>
          <div className="my-3 h-px w-full bg-tenu-hairline" />
          <ul className="flex flex-col gap-2">
            {rooms.map((r) => {
              const count = perRoom[r] ?? 0;
              return (
                <li
                  key={r}
                  className="flex items-center justify-between text-[14px]"
                >
                  <span className="text-tenu-ink">{labelForRoom(r)}</span>
                  <span className={count > 0 ? "text-tenu-ink" : "text-tenu-danger"}>
                    {count} photo{count > 1 ? "s" : ""}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="my-3 h-px w-full bg-tenu-hairline" />
          <div className="flex items-center justify-between text-[14px] font-medium">
            <span className="text-tenu-ink">Total</span>
            <span className="text-tenu-ink">
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
          {stage === "payment" && (
            <div className="flex flex-col gap-4">
              {/* Price line — server-computed preview, TTC. */}
              <div className="border border-tenu-hairline bg-tenu-canvas p-4">
                <p className="text-[12px] font-medium text-tenu-ink-muted">
                  Paiement
                </p>
                <div className="mt-1 flex items-baseline justify-between gap-3">
                  <p className="text-[15px] text-tenu-ink">
                    {product === "exit_only"
                      ? "Constat de sortie — analyse"
                      : pricing
                        ? `Rapport d'analyse — ${pricing.tierLabel}`
                        : "Rapport d'analyse"}
                  </p>
                  <p className="text-[15px] font-medium text-tenu-ink">
                    {priceCents != null ? formatEur(priceCents) : "—"}
                  </p>
                </div>
                <p className="mt-1 text-[12px] text-tenu-ink-muted">
                  TVA incluse.
                </p>
              </div>

              {/* L221-28 1° waiver — same component + legal constants as
                  the web checkout. Both boxes gate the CTA below. */}
              <WithdrawalWaiver locale="fr" value={waiver} onChange={setWaiver} />

              <div className="space-y-2">
                <p className="text-[13px] leading-relaxed text-tenu-ink-muted">
                  Le paiement s&apos;effectue sur tenu.world, dans le
                  navigateur sécurisé de votre appareil. Revenez ensuite dans
                  l&apos;application — l&apos;analyse démarre automatiquement
                  une fois le paiement confirmé.
                </p>
                <p className="text-[12px] leading-relaxed text-tenu-ink-muted">
                  Payment takes place on tenu.world in your device&apos;s
                  secure browser. Return to the app afterwards — the analysis
                  starts automatically once payment is confirmed.
                </p>
              </div>

              {payNotice && (
                <p
                  role="alert"
                  className="border border-tenu-danger p-3 text-[13px] text-tenu-danger"
                >
                  {payNotice}
                </p>
              )}
            </div>
          )}
          {stage === "awaiting" && (
            <div className="flex flex-col gap-4">
              <ProgressBlock
                title="En attente du paiement"
                detail="Terminez le paiement dans le navigateur, puis revenez ici. Cet écran se met à jour automatiquement."
                indeterminate
              />
              <p className="text-[12px] leading-relaxed text-tenu-ink-muted">
                Complete the payment in the browser, then return here. This
                screen updates automatically.
              </p>
              {payNotice && (
                <p
                  role="alert"
                  className="border border-tenu-danger p-3 text-[13px] text-tenu-danger"
                >
                  {payNotice}
                </p>
              )}
            </div>
          )}
          {stage === "error" && (
            <div className="border border-tenu-danger p-4 text-[14px] text-tenu-danger">
              <p className="font-medium">Erreur</p>
              <p className="mt-1">{error}</p>
            </div>
          )}
          {stage === "idle" && !minimumOk && (
            <p className="border border-tenu-hairline p-4 text-[13px] text-tenu-ink-muted">
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
              className="hig-press flex h-[52px] w-full items-center justify-center rounded-none bg-tenu-cta text-[16px] font-medium text-tenu-cta-text disabled:cursor-not-allowed disabled:opacity-40"
            >
              {stage === "error" ? "Réessayer l'envoi" : "Envoyer pour analyse"}
            </button>
          )}
          {stage === "payment" && (
            <button
              type="button"
              onClick={() => void startPayment()}
              disabled={!waiver.priorConsent || !waiver.waiver || payBusy}
              className="hig-press flex h-[52px] w-full items-center justify-center rounded-none bg-tenu-cta text-[16px] font-medium text-tenu-cta-text disabled:cursor-not-allowed disabled:opacity-40"
            >
              {payBusy
                ? "Ouverture du paiement…"
                : priceCents != null
                  ? `Payer ${formatEur(priceCents)} sur tenu.world`
                  : "Continuer vers le paiement"}
            </button>
          )}
          {stage === "awaiting" && (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={checkPaymentNow}
                className="hig-press flex h-[52px] w-full items-center justify-center rounded-none border border-tenu-ink text-[16px] font-medium text-tenu-ink"
              >
                Vérifier le paiement
              </button>
              {stripeUrl && (
                <button
                  type="button"
                  onClick={() =>
                    void openStripeCheckout(stripeUrl, {
                      inspectionId,
                      onClose: () => setPollTick((t) => t + 1),
                    })
                  }
                  className="hig-press flex h-[44px] w-full items-center justify-center rounded-none text-[14px] font-medium text-tenu-ink underline decoration-1 underline-offset-4"
                >
                  Rouvrir la page de paiement
                </button>
              )}
            </div>
          )}
          {(stage === "creating" ||
            stage === "uploading" ||
            stage === "scanning") && (
            <button
              type="button"
              disabled
              className="flex h-[52px] w-full cursor-wait items-center justify-center rounded-none bg-tenu-cta text-[16px] font-medium text-tenu-cta-text opacity-40"
            >
              {stage === "scanning" ? "Analyse en cours…" : "Envoi en cours…"}
            </button>
          )}
          <p className="mt-3 text-center text-[12px] leading-snug text-tenu-ink-muted">
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
    <div className="border border-tenu-hairline bg-tenu-canvas p-4">
      <p className="text-[15px] font-medium text-tenu-ink">
        {title}
      </p>
      <p className="mt-1 text-[13px] text-tenu-ink-muted">
        {detail}
      </p>
      {/* Progress rule — hairline track, black fill, 0px radius. */}
      <div className="mt-3 h-1 w-full overflow-hidden bg-tenu-hairline">
        {indeterminate ? (
          <div className="h-full w-1/3 animate-pulse bg-tenu-ink motion-reduce:animate-none" />
        ) : (
          <div
            className="h-full bg-tenu-ink transition-[width] duration-300"
            style={{
              width: `${Math.min(100, Math.max(0, (ratio ?? 0) * 100))}%`,
            }}
          />
        )}
      </div>
    </div>
  );
}

function SuccessGlyph() {
  // Black-on-white checkmark in a Portal-shaped container, sized to
  // mirror the brand mark stack used elsewhere on the welcome screens.
  return (
    <svg width="72" height="72" viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M 4 46 V 24 A 20 20 0 0 1 44 24 V 46 Z"
        fill="var(--color-tenu-ink)"
      />
      <path
        d="M 16 25 L 22 31 L 33 19"
        fill="none"
        stroke="var(--color-tenu-canvas)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
