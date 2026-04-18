"use client";

/**
 * Intro carousel — three-screen onboarding shown on first launch.
 *
 * Apple HIG choices:
 *   - Native horizontal scroll with `scroll-snap` (no JS gesture lib).
 *     iOS WebKit + Android Chromium both honour momentum + snap.
 *   - Page dots reflect scroll position (IntersectionObserver, not state
 *     tied to a custom drag handler — we let the browser drive).
 *   - "Passer" skip control top-right on screens 1 + 2, hidden on screen 3.
 *   - 44pt minimum tap targets on every interactive element.
 *   - Light haptic on slide change, medium on advance CTA, success on
 *     completion. Haptics are best-effort; web preview is silent.
 *   - Status bar already configured by Shell. Safe-area handled by Shell.
 *
 * Brand:
 *   - Background paper #F4F1EA, ink #0B1F3A, emerald #059669 CTA.
 *   - Wordmark Inter Tight 500, lowercase, tracking -0.04em (per
 *     BRAND-GUIDELINES.md §4.1).
 *   - Portal mark on screen 1 (per §5.1: "threshold metaphors").
 *
 * Copy:
 *   - FR launch only. Add other locales after the cohort outcome data.
 *   - Tone: full professional services register (BRAND-GUIDELINES v1.1).
 *
 * Completion contract:
 *   - On final CTA: prefSetBool(IntroCompletedV1, true) → router.replace
 *     '/app-home/'. MobileGate then bypasses the intro on subsequent
 *     launches. Deletion of the app is the only reset path on device.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import TenuMark from "@/components/brand/TenuMark";
import { isNative } from "@/lib/mobile/platform";
import { prefSetBool, PrefKey } from "@/lib/mobile/preferences";

// Brand tokens. Inlined here so the intro is self-contained even before
// Tailwind theme tokens are aligned to Identity v1.
const PAPER = "#F4F1EA";
const INK = "#0B1F3A";
const EMERALD = "#059669";
const EMERALD_PRESSED = "#047857";
const INK_60 = "rgba(11, 31, 58, 0.60)";
const INK_15 = "rgba(11, 31, 58, 0.15)";

interface Slide {
  /** Headline. Two lines max on a 375pt-wide device. */
  title: string;
  /** Subheadline. Three lines max. Plain prose, no buzzwords. */
  body: string;
  /** Visual mark for the slide. */
  visual: "portal" | "evidence" | "shield";
}

const SLIDES: readonly Slide[] = [
  {
    title: "Vos droits. Votre langue. Votre dépôt.",
    body:
      "Tenu accompagne les locataires internationaux en France pour sécuriser leur dépôt de garantie, de l'entrée dans les lieux jusqu'à la restitution.",
    visual: "portal",
  },
  {
    title: "Une preuve carrée, un risque chiffré",
    body:
      "Photos pièce par pièce horodatées, conservées en Europe. Notre analyse signale les retenues abusives avant qu'elles n'arrivent.",
    visual: "evidence",
  },
  {
    title: "Une lettre prête, un cadre juridique",
    body:
      "Si le bailleur retient à tort, Tenu rédige votre courrier de contestation au format CDC, prêt à envoyer en recommandé.",
    visual: "shield",
  },
] as const;

/**
 * Best-effort haptic. Native only; web preview silently no-ops.
 * Wrapped in try/catch because the plugin throws on simulators that
 * lack a Taptic Engine even when isNative() is true.
 */
async function lightHaptic() {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* swallow */
  }
}

async function mediumHaptic() {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    /* swallow */
  }
}

async function successHaptic() {
  if (!isNative()) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    /* swallow */
  }
}

export default function IntroPage() {
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const lastIndex = SLIDES.length - 1;
  const isLast = activeIndex === lastIndex;

  // Watch which slide is currently centred. IntersectionObserver is
  // cheaper than scroll listeners and avoids drift when the user
  // flicks fast.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry with the highest intersectionRatio.
        let best: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (!best || entry.intersectionRatio > best.intersectionRatio) {
            best = entry;
          }
        }
        if (!best || best.intersectionRatio < 0.6) return;
        const idx = Number((best.target as HTMLElement).dataset.index ?? "0");
        setActiveIndex((prev) => {
          if (prev !== idx) {
            void lightHaptic();
          }
          return idx;
        });
      },
      {
        root: track,
        threshold: [0.6, 0.9],
      },
    );

    for (const slide of slideRefs.current) {
      if (slide) observer.observe(slide);
    }
    return () => observer.disconnect();
  }, []);

  const scrollToIndex = useCallback((idx: number) => {
    const track = trackRef.current;
    const slide = slideRefs.current[idx];
    if (!track || !slide) return;
    track.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
  }, []);

  const handleAdvance = useCallback(async () => {
    if (isLast) {
      await mediumHaptic();
      await prefSetBool(PrefKey.IntroCompletedV1, true);
      await successHaptic();
      router.replace("/app-home/");
      return;
    }
    await mediumHaptic();
    scrollToIndex(activeIndex + 1);
  }, [activeIndex, isLast, router, scrollToIndex]);

  const handleSkip = useCallback(async () => {
    await mediumHaptic();
    await prefSetBool(PrefKey.IntroCompletedV1, true);
    router.replace("/app-home/");
  }, [router]);

  const ctaLabel = useMemo(
    () => (isLast ? "Commencer" : "Continuer"),
    [isLast],
  );

  return (
    <div
      className="relative flex h-full flex-1 flex-col"
      style={{ backgroundColor: PAPER, color: INK }}
    >
      {/* Top bar: wordmark + skip. Sticky to top inside the safe area. */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-3 pb-2">
        <span
          className="font-[var(--font-inter-tight)] text-[20px] font-medium lowercase"
          style={{ letterSpacing: "-0.04em", color: INK }}
        >
          tenu
        </span>
        {!isLast && (
          <button
            type="button"
            onClick={handleSkip}
            className="-mr-2 inline-flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-[15px] font-medium"
            style={{ color: INK_60 }}
            aria-label="Passer l'introduction"
          >
            Passer
          </button>
        )}
      </header>

      {/* Carousel track. Native horizontal scroll with snap. */}
      <div
        ref={trackRef}
        className="flex-1 overflow-x-auto overflow-y-hidden"
        style={{
          scrollSnapType: "x mandatory",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div className="flex h-full">
          {SLIDES.map((slide, i) => (
            <section
              key={i}
              data-index={i}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              className="flex h-full w-screen shrink-0 flex-col items-center justify-between px-7 pb-2 pt-6"
              style={{ scrollSnapAlign: "center" }}
              aria-roledescription="slide"
              aria-label={`${i + 1} sur ${SLIDES.length}`}
            >
              <SlideVisual kind={slide.visual} />
              <div className="flex flex-col items-center text-center">
                <h1
                  className="font-[var(--font-inter-tight)] text-[28px] font-medium leading-[1.15]"
                  style={{ letterSpacing: "-0.02em", color: INK }}
                >
                  {slide.title}
                </h1>
                <p
                  className="mt-4 max-w-[28ch] text-[15px] leading-[1.5]"
                  style={{ color: INK_60 }}
                >
                  {slide.body}
                </p>
              </div>
              {/* Spacer to keep the visual / copy block centred while leaving
                  room for the dots + CTA below. */}
              <div aria-hidden className="h-2 w-2 opacity-0">.</div>
            </section>
          ))}
        </div>
      </div>

      {/* Bottom block: dots + CTA. */}
      <div className="px-7 pb-6 pt-3">
        <div
          className="mb-5 flex items-center justify-center gap-2"
          role="tablist"
          aria-label="Étape de l'introduction"
        >
          {SLIDES.map((_, i) => {
            const active = i === activeIndex;
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`Aller à l'étape ${i + 1}`}
                onClick={() => scrollToIndex(i)}
                className="inline-flex h-11 w-7 items-center justify-center"
              >
                <span
                  className="block rounded-full transition-all duration-200"
                  style={{
                    width: active ? 22 : 7,
                    height: 7,
                    backgroundColor: active ? INK : INK_15,
                  }}
                />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleAdvance}
          className="block w-full rounded-full text-[17px] font-medium text-white"
          style={{
            backgroundColor: EMERALD,
            minHeight: 52,
            boxShadow: "0 1px 2px rgba(11, 31, 58, 0.08)",
          }}
          onPointerDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              EMERALD_PRESSED;
          }}
          onPointerUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              EMERALD;
          }}
          onPointerCancel={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              EMERALD;
          }}
        >
          {ctaLabel}
        </button>

        {isLast && (
          <p
            className="mt-3 text-center text-[12px] leading-[1.4]"
            style={{ color: INK_60 }}
          >
            En continuant vous acceptez nos conditions d'utilisation et notre
            politique de confidentialité. Données hébergées en Europe.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Slide visual. Screen 1 uses the official Portal mark per the brand
 * guide. Screens 2 and 3 use minimal pictograms in the same ink colour
 * — no stock illustrations, no clip-art (BRAND-GUIDELINES §6).
 */
function SlideVisual({ kind }: { kind: Slide["visual"] }) {
  if (kind === "portal") {
    return (
      <div className="flex h-[42vh] w-full items-center justify-center">
        <TenuMark
          container="portal"
          size={184}
          fill={INK}
          carve={PAPER}
          title="Tenu"
        />
      </div>
    );
  }

  if (kind === "evidence") {
    // Three stacked translucent cards = layered photo evidence.
    return (
      <div className="flex h-[42vh] w-full items-center justify-center">
        <div className="relative" style={{ width: 184, height: 184 }}>
          <Card offsetX={-22} offsetY={22} rotate={-6} opacity={0.35} />
          <Card offsetX={0} offsetY={0} rotate={0} opacity={0.65} />
          <Card offsetX={22} offsetY={-22} rotate={6} opacity={1} />
        </div>
      </div>
    );
  }

  // shield — abstract document with seal.
  return (
    <div className="flex h-[42vh] w-full items-center justify-center">
      <div
        className="relative"
        style={{
          width: 184,
          height: 184,
          color: INK,
        }}
      >
        <svg viewBox="0 0 184 184" width={184} height={184}>
          {/* Document */}
          <rect
            x="38"
            y="22"
            width="108"
            height="140"
            rx="6"
            fill="none"
            stroke={INK}
            strokeWidth="2"
          />
          {/* Text lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <rect
              key={i}
              x="52"
              y={42 + i * 16}
              width={i === 4 ? 56 : 80}
              height="3"
              rx="1.5"
              fill={INK}
              opacity={0.35}
            />
          ))}
          {/* Seal */}
          <circle
            cx="132"
            cy="138"
            r="22"
            fill={EMERALD}
            opacity="0.95"
          />
          <path
            d="M 122 138 L 130 146 L 144 132"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

function Card({
  offsetX,
  offsetY,
  rotate,
  opacity,
}: {
  offsetX: number;
  offsetY: number;
  rotate: number;
  opacity: number;
}) {
  return (
    <div
      className="absolute left-1/2 top-1/2"
      style={{
        width: 132,
        height: 168,
        transform: `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) rotate(${rotate}deg)`,
        backgroundColor: "#FFFFFF",
        border: `1px solid ${INK_15}`,
        borderRadius: 10,
        boxShadow: "0 6px 18px rgba(11, 31, 58, 0.10)",
        opacity,
      }}
    >
      {/* Pretend image area */}
      <div
        style={{
          margin: 10,
          height: 100,
          borderRadius: 6,
          backgroundColor: PAPER,
          border: `1px solid ${INK_15}`,
        }}
      />
      {/* Pretend caption */}
      <div
        style={{
          margin: "0 10px",
          height: 6,
          width: 70,
          borderRadius: 3,
          backgroundColor: INK_15,
        }}
      />
      <div
        style={{
          margin: "8px 10px 0",
          height: 6,
          width: 50,
          borderRadius: 3,
          backgroundColor: INK_15,
        }}
      />
    </div>
  );
}
