"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, Check } from "lucide-react";
import { clsx } from "clsx";
import WithdrawalWaiver, {
  type WaiverState,
} from "@/components/legal/WithdrawalWaiver";
import { WAIVER_TEXT_VERSION } from "@/lib/legal/withdrawal-waiver";
import { type Locale, locales } from "@/lib/i18n/config";

// Pricing page — pre-scan. Only the scan is sold here.
// The dispute letter is a post-scan add-on (verdict-gated) and is
// purchased from the report page once the scan output is known.
// Selling a combo pre-scan would charge users for a letter that may
// fail the eligibility gate after the scan runs.

// Shape mirrored from /api/checkout GET (calculatePrice output).
// We don't import the type from lib/payments/stripe.ts because this is
// a client bundle and that module is server-only (Stripe SDK inside).
interface PricePreview {
  tier: "t1" | "t2" | "t3" | "t4" | "t5_maison";
  tierLabel: string;
  principalRoomCount: number;
  serviceRoomCount: number;
  partiePrivativeCount: number;
  totalReportPrice: number;
  disputeLetterPrice: number;
  exitOnlyPrice: number;
  currency: string;
}

const FALLBACK_PREVIEW: PricePreview = {
  tier: "t1",
  tierLabel: "Studio / T1",
  principalRoomCount: 1,
  serviceRoomCount: 0,
  partiePrivativeCount: 0,
  totalReportPrice: 1500,
  disputeLetterPrice: 2000,
  exitOnlyPrice: 2500,
  currency: "eur",
};

function formatPrice(cents: number, currency: string): string {
  const amount = cents / 100;
  if (currency === "gbp") return `£${amount.toFixed(0)}`;
  return `€${amount.toFixed(0)}`;
}

// UI copy per locale — legal waiver text stays in FR/EN (see WithdrawalWaiver).
// withdrawal-waiver.ts: "DO NOT translate through LLM. Requires avocat review."
// For ZH/AR/UR users the waiver is shown in EN.
interface PriceCopy {
  heading: string;
  subheading: string;
  disputeNote: (price: string) => string;
  scanTitle: string;
  scanDesc: string;
  vatLabel: string;
  principalUnit: (n: number) => string;
  serviceUnit: string;
  annexeUnit: (n: number) => string;
  features: string[];
  colocNote: string;
  runScan: (price: string) => string;
  cancel: string;
  pay: (price: string) => string;
  redirecting: string;
  errorBothBoxes: string;
  errorNoInspection: string;
  startLink: string;
}

const COPY: Record<Locale, PriceCopy> = {
  fr: {
    heading: "Protégez votre dépôt",
    subheading: "Rapport IA d'état des lieux pour anticiper les retenues avant la sortie.",
    disputeNote: (p) => `La lettre de contestation (${p}) se commande après le scan, selon le verdict.`,
    scanTitle: "Scan risque IA",
    scanDesc: "Connaissez le risque sur votre dépôt avant de signer l'état des lieux de sortie.",
    vatLabel: "TTC",
    principalUnit: (n) => `${n} pièce${n > 1 ? "s" : ""} principale${n > 1 ? "s" : ""}`,
    serviceUnit: "de service",
    annexeUnit: (n) => `annexe${n > 1 ? "s" : ""}`,
    features: [
      "Analyse IA de chaque pièce principale, service et annexe",
      "Estimation des retenues équitables (grille vétusté française)",
      "Dossier photo horodaté et conservé pour preuve",
      "Rapport PDF téléchargeable",
      "Résultats en moins de 2 minutes",
    ],
    colocNote:
      "Colocation : chaque colocataire achète son scan au tarif du logement. Un couple partageant le même bail = un seul tenant.",
    runScan: (p) => `Lancer mon scan — ${p}`,
    cancel: "Annuler",
    pay: (p) => `Payer ${p}`,
    redirecting: "Redirection…",
    errorBothBoxes: "Les deux cases de renonciation doivent être cochées.",
    errorNoInspection: "Aucune inspection sélectionnée. Commencez par créer une inspection.",
    startLink: "Commencez par créer une inspection",
  },
  en: {
    heading: "Protect your deposit",
    subheading: "AI inspection report to anticipate deductions before you hand back the keys.",
    disputeNote: (p) => `The dispute letter (${p}) is ordered after the scan, based on the verdict.`,
    scanTitle: "AI Risk Scan",
    scanDesc: "Know your deposit risk before the landlord signs the exit EDL.",
    vatLabel: "inc. VAT",
    principalUnit: (n) => `${n} principal room${n > 1 ? "s" : ""}`,
    serviceUnit: "service",
    annexeUnit: (n) => `annexe${n > 1 ? "s" : ""}`,
    features: [
      "AI photo analysis of every principal, service and annexe room",
      "Fair-deduction estimate per room (French vétusté grid)",
      "Timestamped photo evidence pack for your records",
      "Downloadable PDF report",
      "Results in under 2 minutes",
    ],
    colocNote:
      "Colocation: each housemate buys a scan at the flat's tier. A couple sharing one tenancy counts as one tenant.",
    runScan: (p) => `Run my scan — ${p}`,
    cancel: "Cancel",
    pay: (p) => `Pay ${p}`,
    redirecting: "Redirecting…",
    errorBothBoxes: "Both waiver boxes must be ticked.",
    errorNoInspection: "No inspection selected. Start a new inspection first.",
    startLink: "Start a new inspection first",
  },
  ar: {
    heading: "احمِ وديعتك",
    subheading: "تقرير فحص بالذكاء الاصطناعي لتوقّع الاستقطاعات قبل تسليم المفاتيح.",
    disputeNote: (p) => `خطاب النزاع (${p}) يُطلَب بعد الفحص بناءً على النتيجة.`,
    scanTitle: "مسح مخاطر الذكاء الاصطناعي",
    scanDesc: "اعرف مخاطر وديعتك قبل أن يوقّع المالك على محضر المغادرة.",
    vatLabel: "شامل الضريبة",
    principalUnit: (n) => `${n} غرفة رئيسية`,
    serviceUnit: "خدمية",
    annexeUnit: () => "ملحقة",
    features: [
      "تحليل ذكاء اصطناعي للصور لكل غرفة رئيسية وخدمية وملحقة",
      "تقدير الاستقطاعات العادلة (مقياس الإهلاك الفرنسي)",
      "حزمة صور موثقة بالوقت كدليل",
      "تقرير PDF قابل للتنزيل",
      "النتائج في أقل من دقيقتين",
    ],
    colocNote:
      "الإقامة المشتركة: كل مستأجر يشتري مسحه بسعر الشقة. زوجان يتشاركان عقداً واحداً = مستأجر واحد.",
    runScan: (p) => `ابدأ مسحي — ${p}`,
    cancel: "إلغاء",
    pay: (p) => `ادفع ${p}`,
    redirecting: "جارٍ التحويل…",
    errorBothBoxes: "يجب تحديد خانتي الإقرار للمتابعة.",
    errorNoInspection: "لم يتم اختيار أي فحص. ابدأ فحصاً جديداً أولاً.",
    startLink: "ابدأ فحصاً جديداً أولاً",
  },
  zh: {
    heading: "保护您的押金",
    subheading: "AI 检测报告，在交钥匙前预判房东可能扣除的费用。",
    disputeNote: (p) => `争议信 (${p}) 在扫描完成后根据结果单独购买。`,
    scanTitle: "AI 风险扫描",
    scanDesc: "在房东签署退租清单之前，了解押金风险。",
    vatLabel: "含税",
    principalUnit: (n) => `${n} 间主要房间`,
    serviceUnit: "服务间",
    annexeUnit: (n) => `${n} 间附属空间`,
    features: [
      "AI 逐室照片分析（主卧、服务间及附属空间）",
      "依据法国折旧标准估算合理扣除金额",
      "带时间戳的照片证据包",
      "可下载的 PDF 报告",
      "2 分钟内出结果",
    ],
    colocNote:
      "合租：每位租客按房型价格单独购买扫描。一对夫妻共用同一租约视为一位租客。",
    runScan: (p) => `开始扫描 — ${p}`,
    cancel: "取消",
    pay: (p) => `支付 ${p}`,
    redirecting: "跳转中…",
    errorBothBoxes: "必须勾选两个声明复选框才能继续。",
    errorNoInspection: "未选择检测项目，请先创建新检测。",
    startLink: "先创建新检测",
  },
  ur: {
    heading: "اپنی ضمانت رقم محفوظ رکھیں",
    subheading: "AI معائنہ رپورٹ — چابیاں واپس کرنے سے پہلے کٹوتیوں کا اندازہ لگائیں۔",
    disputeNote: (p) => `تنازع خط (${p}) اسکین کے بعد نتیجے کی بنیاد پر منگوایا جاتا ہے۔`,
    scanTitle: "AI خطرہ اسکین",
    scanDesc: "مالک مکان کے EDL پر دستخط سے پہلے اپنی ضمانت کا خطرہ جانیں۔",
    vatLabel: "VAT سمیت",
    principalUnit: (n) => `${n} اہم کمرہ`,
    serviceUnit: "سروس",
    annexeUnit: () => "ضمیمہ",
    features: [
      "ہر اہم، سروس اور ضمیمہ کمرے کی AI فوٹو تجزیہ",
      "فی کمرہ منصفانہ کٹوتی کا تخمینہ (فرانسیسی وقت گزاری گرڈ)",
      "ثبوت کے لیے ٹائم اسٹیمپ تصویری پیکیج",
      "ڈاؤنلوڈ کے قابل PDF رپورٹ",
      "2 منٹ سے کم میں نتائج",
    ],
    colocNote:
      "مشترکہ رہائش: ہر ساتھی کرایہ دار فلیٹ کی سطح پر اسکین خریدتا ہے۔ ایک معاہدے پر جوڑا = ایک کرایہ دار۔",
    runScan: (p) => `میرا اسکین چلائیں — ${p}`,
    cancel: "منسوخ",
    pay: (p) => `${p} ادا کریں`,
    redirecting: "منتقل ہو رہا ہے…",
    errorBothBoxes: "ادائیگی کے لیے دونوں خانوں پر نشان لگانا ضروری ہے۔",
    errorNoInspection: "کوئی معائنہ منتخب نہیں۔ پہلے نیا معائنہ بنائیں۔",
    startLink: "پہلے نیا معائنہ بنائیں",
  },
  // P2/P3 locales fall back to English until translated
  hi: null as unknown as PriceCopy,
  ja: null as unknown as PriceCopy,
  es: null as unknown as PriceCopy,
  pt: null as unknown as PriceCopy,
  ko: null as unknown as PriceCopy,
};

function resolveCopy(locale: Locale): PriceCopy {
  return COPY[locale] ?? COPY["en"];
}

// Legal waiver only exists in FR/EN (avocat-reviewed text).
// ZH/AR/UR users see the EN version.
function waiverLocale(locale: Locale): "fr" | "en" {
  return locale === "fr" ? "fr" : "en";
}

export default function PricingPage() {
  const searchParams = useSearchParams();
  const inspectionId = searchParams.get("inspectionId");

  const rawLocale = searchParams.get("locale") ?? "";
  const locale: Locale = locales.includes(rawLocale as Locale)
    ? (rawLocale as Locale)
    : "fr";
  const copy = resolveCopy(locale);

  const [preview, setPreview] = useState<PricePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(Boolean(inspectionId));
  const [previewError, setPreviewError] = useState("");

  const [waiverOpen, setWaiverOpen] = useState(false);
  const [waiver, setWaiver] = useState<WaiverState>({
    priorConsent: false,
    waiver: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const waiverReady = waiver.priorConsent && waiver.waiver;

  // Fetch the live tier/price from the server the moment we have an
  // inspectionId. Server is the single source of truth — we never let
  // the client guess the tier from URL params.
  useEffect(() => {
    if (!inspectionId) {
      setPreviewLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/checkout?inspectionId=${encodeURIComponent(inspectionId)}`,
        );
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setPreviewError(data.error ?? "Unable to load pricing");
          setPreview(FALLBACK_PREVIEW);
        } else if (data.pricing) {
          setPreview(data.pricing as PricePreview);
        } else {
          setPreview(FALLBACK_PREVIEW);
        }
      } catch {
        if (!cancelled) {
          setPreviewError("Network error");
          setPreview(FALLBACK_PREVIEW);
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [inspectionId]);

  async function proceedToPayment() {
    if (!inspectionId) {
      setError(copy.errorNoInspection);
      return;
    }
    if (!waiverReady) {
      setError(copy.errorBothBoxes);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: "report",
          inspectionId,
          successUrl: `${window.location.origin}/inspection/${inspectionId}/report?payment=success`,
          cancelUrl: `${window.location.origin}/pricing?inspectionId=${inspectionId}&cancelled=true`,
          waiverConsent: {
            priorConsent: waiver.priorConsent,
            waiver: waiver.waiver,
            locale: waiverLocale(locale),
            textVersion: WAIVER_TEXT_VERSION,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  // What the user sees for price + tier.
  // If we failed to fetch, we fall back to the T1 baseline so the page
  // isn't empty, but we also surface the error so the user knows.
  const activePreview = preview ?? FALLBACK_PREVIEW;
  const priceLabel = formatPrice(activePreview.totalReportPrice, activePreview.currency);
  const disputeLabel = formatPrice(activePreview.disputeLetterPrice, activePreview.currency);

  return (
    <div className="min-h-screen bg-tenu-cream">
      <header className="border-b border-tenu-cream-dark bg-white px-6 py-4">
        <Link href="/" className="text-xl font-bold text-tenu-forest">
          tenu
        </Link>
      </header>

      <main className="mx-auto max-w-xl px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-tenu-forest">
            {copy.heading}
          </h1>
          <p className="mt-2 text-tenu-slate/70">
            {copy.subheading}
          </p>
          <p className="mt-3 text-xs text-tenu-slate/60">
            {copy.disputeNote(disputeLabel)}
          </p>
        </div>

        <div className="grid gap-6">
          <div
            className={clsx(
              "relative flex flex-col rounded-2xl border border-tenu-forest bg-white p-6 shadow-lg",
            )}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-tenu-forest" />
                <h2 className="text-lg font-semibold text-tenu-forest">
                  {copy.scanTitle}
                </h2>
              </div>
              {!previewLoading && (
                <span className="rounded-full border border-tenu-forest/30 bg-tenu-cream px-3 py-1 text-xs font-medium text-tenu-forest">
                  {activePreview.tierLabel}
                </span>
              )}
            </div>

            <p className="mb-4 text-sm text-tenu-slate/70">
              {copy.scanDesc}
            </p>

            <p className="mb-2 text-3xl font-bold text-tenu-forest">
              {previewLoading ? "…" : priceLabel}
              <span className="text-sm font-normal text-tenu-slate/50">
                {" "}
                {copy.vatLabel}
              </span>
            </p>

            {!previewLoading && (
              <p className="mb-6 text-xs text-tenu-slate/60">
                {copy.principalUnit(activePreview.principalRoomCount)}
                {activePreview.serviceRoomCount > 0 && (
                  <>
                    {" · "}
                    {activePreview.serviceRoomCount}{" "}
                    {copy.serviceUnit}
                  </>
                )}
                {activePreview.partiePrivativeCount > 0 && (
                  <>
                    {" · "}
                    {copy.annexeUnit(activePreview.partiePrivativeCount)}
                  </>
                )}
              </p>
            )}

            <ul className="mb-6 flex-1 space-y-2">
              {copy.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-tenu-slate"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-tenu-forest" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <p className="mb-4 text-xs text-tenu-slate/60">
              {copy.colocNote}
            </p>

            {!waiverOpen ? (
              <button
                onClick={() => {
                  setWaiverOpen(true);
                  setWaiver({ priorConsent: false, waiver: false });
                  setError("");
                }}
                disabled={loading || previewLoading || !inspectionId}
                className="w-full rounded-lg bg-tenu-forest px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-tenu-forest-light disabled:opacity-50"
              >
                {copy.runScan(priceLabel)}
              </button>
            ) : (
              <div className="space-y-3">
                <WithdrawalWaiver
                  locale={waiverLocale(locale)}
                  value={waiver}
                  onChange={setWaiver}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setWaiverOpen(false)}
                    className="flex-1 rounded-lg border border-tenu-cream-dark px-4 py-3 text-sm font-medium text-tenu-slate hover:bg-tenu-cream"
                  >
                    {copy.cancel}
                  </button>
                  <button
                    onClick={proceedToPayment}
                    disabled={!waiverReady || loading}
                    className="flex-[2] rounded-lg bg-tenu-forest px-4 py-3 text-sm font-medium text-white hover:bg-tenu-forest-light disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? copy.redirecting
                      : copy.pay(priceLabel)}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {previewError && (
          <p className="mt-6 text-center text-xs text-tenu-danger">
            {previewError}
          </p>
        )}

        {error && (
          <p className="mt-6 text-center text-sm text-tenu-danger">{error}</p>
        )}

        {!inspectionId && (
          <div className="mt-8 text-center">
            <Link
              href="/inspection/new"
              className="text-sm text-tenu-forest underline hover:no-underline"
            >
              {copy.startLink}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
