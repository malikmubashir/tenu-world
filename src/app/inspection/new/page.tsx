"use client";

/**
 * NewInspectionPage — Multi-section form to create a new inspection.
 *
 * Collects: jurisdiction, inspection type, property details, owner info,
 * tenant(s) (1–3), contract details, room selection.
 * Zone tendue auto-detected from postal code (FR only).
 *
 * UI is localized via COPY dict; canonical FR room labels are still
 * sent to the API so the database keeps a single language for storage.
 */

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ProgressStepper from "@/components/ui/ProgressStepper";
import { type Locale, locales } from "@/lib/i18n/config";

/* ── Room definitions matching the API and état des lieux spec ── */

interface RoomOption {
  type: string;
  /** Canonical FR label — sent to the API and stored in the DB. */
  label: string;
  category: "base" | "extra" | "privative";
}

const ROOM_OPTIONS: RoomOption[] = [
  { type: "entree", label: "Entrée", category: "base" },
  { type: "salon", label: "Salon", category: "base" },
  { type: "cuisine", label: "Cuisine", category: "base" },
  { type: "salle_de_bain", label: "Salle de bain", category: "base" },
  { type: "wc", label: "WC", category: "base" },
  { type: "chambre", label: "Chambre", category: "extra" },
  { type: "chambre_2", label: "Chambre 2", category: "extra" },
  { type: "chambre_3", label: "Chambre 3", category: "extra" },
  { type: "salle_a_manger", label: "Salle à manger", category: "extra" },
  { type: "salle_de_bain_2", label: "Salle de bain 2", category: "extra" },
  { type: "wc_2", label: "WC 2", category: "extra" },
  { type: "cave", label: "Cave", category: "privative" },
  { type: "parking", label: "Parking", category: "privative" },
  { type: "balcon", label: "Balcon", category: "privative" },
  { type: "terrasse", label: "Terrasse", category: "privative" },
  { type: "jardin", label: "Jardin", category: "privative" },
];

const BASE_ROOMS = ROOM_OPTIONS.filter((r) => r.category === "base");

/* ── Tenant type ── */

interface TenantInput {
  fullName: string;
  email: string;
  phone: string;
}

const emptyTenant = (): TenantInput => ({ fullName: "", email: "", phone: "" });

/* ── Shared input class ── */

const inputClass =
  "w-full rounded-lg border border-tenu-cream-dark px-3 py-2 text-sm outline-none focus:border-tenu-forest focus:ring-1 focus:ring-tenu-forest";

const labelClass = "mb-1 block text-sm font-medium text-tenu-slate";

/* ── Zone tendue client-side check (lightweight, matches server) ── */

function extractPostalCode(address: string): string | null {
  const match = address.match(/\b(\d{5})\b/);
  return match ? match[1] : null;
}

/* We only check département-level on client for instant UI feedback.
   The full check happens server-side in the API route. */
const ZONE_TENDUE_DEPTS = new Set([
  "75", "92", "93", "94", "78", "91", "95", "77", // Île-de-France
  "69", "13", "06", "33", "31", "34", "59", "67", "44", "35", "38",
  "83", "74", "76",
]);

function isLikelyZoneTendue(postalCode: string): boolean {
  if (postalCode.length !== 5) return false;
  return ZONE_TENDUE_DEPTS.has(postalCode.substring(0, 2));
}

/* ── Localized copy ── */

interface InspectionCopy {
  steps: { details: string; capture: string; review: string; report: string };
  pageTitle: string;

  // Section 1
  sectionTypeTitle: string;
  inspectionMoveIn: string;
  inspectionMoveOut: string;
  countryLabel: string;
  countryFr: string;
  countryUk: string;

  // Section 2
  sectionPropertyTitle: string;
  addressLabel: string;
  addressPlaceholder: string;
  zoneTendue: (postal: string, months: number) => string;
  zoneNonTendue: (postal: string, months: number) => string;
  propertyTypeLabel: string;
  propertyApartment: string;
  propertyHouse: string;
  furnishedLabel: string;
  furnishedNo: string;
  furnishedYes: string;
  surfaceLabel: string;
  surfacePlaceholder: string;
  mainRoomsLabel: string;
  mainRoomsPlaceholder: string;

  // Section 3
  sectionOwnerTitle: string;
  ownerIndividual: string;
  ownerCompany: string;
  ownerNameCompany: string;
  ownerNameIndividual: string;
  ownerNamePlaceholderCompany: string;
  ownerNamePlaceholderIndividual: string;
  ownerCompanyLabel: string;
  ownerCompanyPlaceholder: string;
  ownerEmailLabel: string;
  ownerEmailPlaceholder: string;
  ownerPhoneLabel: string;
  ownerPhonePlaceholder: string;
  ownerAddressLabel: string;
  ownerAddressPlaceholder: string;

  // Section 4
  tenantTitleSingular: string;
  tenantTitlePlural: string;
  addTenant: string;
  tenantNumber: (n: number) => string;
  removeTenant: string;
  tenantFullNameLabel: string;
  tenantFullNamePlaceholder: string;
  tenantEmailLabel: string;
  tenantEmailPlaceholder: string;
  tenantPhoneLabel: string;
  tenantPhonePlaceholder: string;
  tenantMaxNote: string;

  // Section 5
  sectionLeaseTitle: string;
  leaseStartLabel: string;
  leaseEndLabel: string;
  leaseEndHint: string;
  rentLabel: (currency: string) => string;
  chargesLabel: (currency: string) => string;
  rentPlaceholder: string;
  chargesPlaceholder: string;
  noticePeriod: (months: number, suffix: string) => string;
  noticeFurnishedSuffix: string;
  noticeZoneTendueSuffix: string;

  // Section 6
  sectionRoomsTitle: string;
  roomsBaseHeader: string;
  roomsExtraHeader: (currency: string) => string;
  roomsPrivativeHeader: (currency: string) => string;
  roomLabels: Record<string, string>;

  // Errors + submit
  errorAddress: string;
  errorRoom: string;
  errorTenant: string;
  errorGeneric: string;
  submitLoading: string;
  submitIdle: string;
}

const COPY: Record<Locale, InspectionCopy> = {
  fr: {
    steps: { details: "Détails", capture: "Photos", review: "Vérification", report: "Rapport" },
    pageTitle: "Nouvel état des lieux",

    sectionTypeTitle: "Type d'inspection",
    inspectionMoveIn: "État des lieux d'entrée",
    inspectionMoveOut: "État des lieux de sortie",
    countryLabel: "Pays",
    countryFr: "France",
    countryUk: "Royaume-Uni",

    sectionPropertyTitle: "Le bien",
    addressLabel: "Adresse du bien",
    addressPlaceholder: "123 Rue de la Paix, 75002 Paris",
    zoneTendue: (p, m) => `Zone tendue (${p}) — préavis ${m} mois`,
    zoneNonTendue: (p, m) => `Zone non tendue (${p}) — préavis ${m} mois`,
    propertyTypeLabel: "Type de bien",
    propertyApartment: "Appartement",
    propertyHouse: "Maison",
    furnishedLabel: "Meublé",
    furnishedNo: "Non meublé",
    furnishedYes: "Meublé",
    surfaceLabel: "Surface (m²)",
    surfacePlaceholder: "45",
    mainRoomsLabel: "Pièces principales",
    mainRoomsPlaceholder: "2",

    sectionOwnerTitle: "Propriétaire / Bailleur",
    ownerIndividual: "Particulier",
    ownerCompany: "Société / Agence",
    ownerNameCompany: "Nom du représentant",
    ownerNameIndividual: "Nom complet",
    ownerNamePlaceholderCompany: "M. Dupont",
    ownerNamePlaceholderIndividual: "Mme Martin",
    ownerCompanyLabel: "Raison sociale",
    ownerCompanyPlaceholder: "SCI Martin Immobilier",
    ownerEmailLabel: "Email",
    ownerEmailPlaceholder: "proprietaire@email.com",
    ownerPhoneLabel: "Téléphone",
    ownerPhonePlaceholder: "06 12 34 56 78",
    ownerAddressLabel: "Adresse postale du bailleur",
    ownerAddressPlaceholder: "Pour la lettre de contestation",

    tenantTitleSingular: "Locataire",
    tenantTitlePlural: "Locataires",
    addTenant: "+ Ajouter un locataire",
    tenantNumber: (n) => `Locataire ${n}`,
    removeTenant: "Supprimer",
    tenantFullNameLabel: "Nom complet *",
    tenantFullNamePlaceholder: "Prénom Nom",
    tenantEmailLabel: "Email",
    tenantEmailPlaceholder: "locataire@email.com",
    tenantPhoneLabel: "Téléphone",
    tenantPhonePlaceholder: "06 00 00 00 00",
    tenantMaxNote: "Maximum 3 locataires par inspection",

    sectionLeaseTitle: "Contrat de bail",
    leaseStartLabel: "Date de début",
    leaseEndLabel: "Date de fin",
    leaseEndHint: "Laisser vide si durée indéterminée",
    rentLabel: (c) => `Loyer mensuel (${c})`,
    chargesLabel: (c) => `Charges (${c})`,
    rentPlaceholder: "800.00",
    chargesPlaceholder: "50.00",
    noticePeriod: (m, s) => `Préavis de départ : ${m} mois${s}`,
    noticeFurnishedSuffix: " (meublé)",
    noticeZoneTendueSuffix: " (zone tendue)",

    sectionRoomsTitle: "Pièces à inspecter",
    roomsBaseHeader: "Pièces principales (incluses)",
    roomsExtraHeader: (c) => `Pièces supplémentaires (+5${c} chacune)`,
    roomsPrivativeHeader: (c) => `Parties privatives (+5${c} chacune)`,
    roomLabels: {
      entree: "Entrée",
      salon: "Salon",
      cuisine: "Cuisine",
      salle_de_bain: "Salle de bain",
      wc: "WC",
      chambre: "Chambre",
      chambre_2: "Chambre 2",
      chambre_3: "Chambre 3",
      salle_a_manger: "Salle à manger",
      salle_de_bain_2: "Salle de bain 2",
      wc_2: "WC 2",
      cave: "Cave",
      parking: "Parking",
      balcon: "Balcon",
      terrasse: "Terrasse",
      jardin: "Jardin",
    },

    errorAddress: "L'adresse est obligatoire",
    errorRoom: "Sélectionnez au moins une pièce",
    errorTenant: "Le nom du locataire est obligatoire",
    errorGeneric: "Une erreur est survenue",
    submitLoading: "Création en cours...",
    submitIdle: "Commencer les photos",
  },
  en: {
    steps: { details: "Details", capture: "Photos", review: "Review", report: "Report" },
    pageTitle: "New property inspection",

    sectionTypeTitle: "Inspection type",
    inspectionMoveIn: "Move-in inspection",
    inspectionMoveOut: "Move-out inspection",
    countryLabel: "Country",
    countryFr: "France",
    countryUk: "United Kingdom",

    sectionPropertyTitle: "The property",
    addressLabel: "Property address",
    addressPlaceholder: "123 Rue de la Paix, 75002 Paris",
    zoneTendue: (p, m) => `High-demand zone (${p}) — ${m}-month notice`,
    zoneNonTendue: (p, m) => `Standard zone (${p}) — ${m}-month notice`,
    propertyTypeLabel: "Property type",
    propertyApartment: "Apartment",
    propertyHouse: "House",
    furnishedLabel: "Furnishing",
    furnishedNo: "Unfurnished",
    furnishedYes: "Furnished",
    surfaceLabel: "Surface (m²)",
    surfacePlaceholder: "45",
    mainRoomsLabel: "Main rooms",
    mainRoomsPlaceholder: "2",

    sectionOwnerTitle: "Owner / Landlord",
    ownerIndividual: "Individual",
    ownerCompany: "Company / Agency",
    ownerNameCompany: "Representative name",
    ownerNameIndividual: "Full name",
    ownerNamePlaceholderCompany: "Mr Dupont",
    ownerNamePlaceholderIndividual: "Ms Martin",
    ownerCompanyLabel: "Company name",
    ownerCompanyPlaceholder: "SCI Martin Immobilier",
    ownerEmailLabel: "Email",
    ownerEmailPlaceholder: "landlord@email.com",
    ownerPhoneLabel: "Phone",
    ownerPhonePlaceholder: "06 12 34 56 78",
    ownerAddressLabel: "Landlord postal address",
    ownerAddressPlaceholder: "Used for the dispute letter",

    tenantTitleSingular: "Tenant",
    tenantTitlePlural: "Tenants",
    addTenant: "+ Add a tenant",
    tenantNumber: (n) => `Tenant ${n}`,
    removeTenant: "Remove",
    tenantFullNameLabel: "Full name *",
    tenantFullNamePlaceholder: "First Last",
    tenantEmailLabel: "Email",
    tenantEmailPlaceholder: "tenant@email.com",
    tenantPhoneLabel: "Phone",
    tenantPhonePlaceholder: "06 00 00 00 00",
    tenantMaxNote: "Maximum 3 tenants per inspection",

    sectionLeaseTitle: "Lease contract",
    leaseStartLabel: "Start date",
    leaseEndLabel: "End date",
    leaseEndHint: "Leave blank if open-ended",
    rentLabel: (c) => `Monthly rent (${c})`,
    chargesLabel: (c) => `Charges (${c})`,
    rentPlaceholder: "800.00",
    chargesPlaceholder: "50.00",
    noticePeriod: (m, s) => `Notice period: ${m} month${m > 1 ? "s" : ""}${s}`,
    noticeFurnishedSuffix: " (furnished)",
    noticeZoneTendueSuffix: " (high-demand zone)",

    sectionRoomsTitle: "Rooms to inspect",
    roomsBaseHeader: "Main rooms (included)",
    roomsExtraHeader: (c) => `Extra rooms (+5${c} each)`,
    roomsPrivativeHeader: (c) => `Private areas (+5${c} each)`,
    roomLabels: {
      entree: "Entrance",
      salon: "Living room",
      cuisine: "Kitchen",
      salle_de_bain: "Bathroom",
      wc: "Toilet",
      chambre: "Bedroom",
      chambre_2: "Bedroom 2",
      chambre_3: "Bedroom 3",
      salle_a_manger: "Dining room",
      salle_de_bain_2: "Bathroom 2",
      wc_2: "Toilet 2",
      cave: "Cellar",
      parking: "Parking",
      balcon: "Balcony",
      terrasse: "Terrace",
      jardin: "Garden",
    },

    errorAddress: "Address is required",
    errorRoom: "Select at least one room",
    errorTenant: "Tenant name is required",
    errorGeneric: "Something went wrong",
    submitLoading: "Creating...",
    submitIdle: "Start photos",
  },
  ar: null as unknown as InspectionCopy,
  zh: null as unknown as InspectionCopy,
  ur: null as unknown as InspectionCopy,
  hi: null as unknown as InspectionCopy,
  ja: null as unknown as InspectionCopy,
  es: null as unknown as InspectionCopy,
  pt: null as unknown as InspectionCopy,
  ko: null as unknown as InspectionCopy,
};

function resolveCopy(locale: Locale): InspectionCopy {
  return COPY[locale] ?? COPY["en"];
}

/* ── Component ── */

export default function NewInspectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawLocale = searchParams.get("locale") ?? "";
  const locale: Locale = locales.includes(rawLocale as Locale)
    ? (rawLocale as Locale)
    : "fr";
  const copy = resolveCopy(locale);

  const steps = [
    { key: "details", label: copy.steps.details },
    { key: "capture", label: copy.steps.capture },
    { key: "review", label: copy.steps.review },
    { key: "report", label: copy.steps.report },
  ];

  // Basic
  const [jurisdiction, setJurisdiction] = useState<"fr" | "uk">("fr");
  const [inspectionType, setInspectionType] = useState<"move_in" | "move_out">("move_in");
  const [address, setAddress] = useState("");

  // Property
  const [propertyType, setPropertyType] = useState<"appartement" | "maison">("appartement");
  const [furnished, setFurnished] = useState(false);
  const [surfaceM2, setSurfaceM2] = useState("");
  const [mainRooms, setMainRooms] = useState("");

  // Owner
  const [ownerType, setOwnerType] = useState<"individual" | "company">("individual");
  const [ownerName, setOwnerName] = useState("");
  const [ownerCompanyName, setOwnerCompanyName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");

  // Tenants (1–3)
  const [tenants, setTenants] = useState<TenantInput[]>([emptyTenant()]);

  // Contract
  const [leaseStartDate, setLeaseStartDate] = useState("");
  const [leaseEndDate, setLeaseEndDate] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [monthlyCharges, setMonthlyCharges] = useState("");

  // Rooms
  const [selectedRooms, setSelectedRooms] = useState<RoomOption[]>([...BASE_ROOMS]);

  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Gate: confirm DPA acceptance before showing the form.
  const [dpaChecking, setDpaChecking] = useState(true);

  useEffect(() => {
    fetch("/api/consents")
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/auth/login?redirect=/inspection/new");
          return;
        }
        const data = (await res.json()) as {
          consents: Array<{ consent_type: string; checkbox_checked: boolean }>;
        };
        const hasDpa = (data.consents ?? []).some(
          (c) => c.consent_type === "dpa_acceptance" && c.checkbox_checked === true,
        );
        if (!hasDpa) {
          router.replace("/auth/accept-terms?redirect=/inspection/new");
          return;
        }
        setDpaChecking(false);
      })
      .catch(() => setDpaChecking(false));
  }, [router]);

  if (dpaChecking) return null;

  const currency = jurisdiction === "fr" ? "€" : "£";

  /* ── Zone tendue feedback ── */
  const postalCode = useMemo(() => extractPostalCode(address), [address]);
  const zoneTendueHint = useMemo(() => {
    if (jurisdiction !== "fr" || !postalCode) return null;
    return isLikelyZoneTendue(postalCode);
  }, [jurisdiction, postalCode]);

  const noticePeriod = useMemo(() => {
    if (jurisdiction === "uk") return 1;
    if (furnished) return 1;
    return zoneTendueHint ? 1 : 3;
  }, [jurisdiction, furnished, zoneTendueHint]);

  /* ── Room toggle ── */
  function toggleRoom(room: RoomOption) {
    setSelectedRooms((prev) =>
      prev.find((r) => r.type === room.type)
        ? prev.filter((r) => r.type !== room.type)
        : [...prev, room],
    );
  }

  /* ── Tenant management ── */
  function addTenant() {
    if (tenants.length < 3) setTenants((prev) => [...prev, emptyTenant()]);
  }
  function removeTenant(idx: number) {
    if (tenants.length > 1) setTenants((prev) => prev.filter((_, i) => i !== idx));
  }
  function updateTenant(idx: number, field: keyof TenantInput, value: string) {
    setTenants((prev) => prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)));
  }

  /* ── Submit ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) { setError(copy.errorAddress); return; }
    if (selectedRooms.length === 0) { setError(copy.errorRoom); return; }
    if (!tenants[0].fullName.trim()) { setError(copy.errorTenant); return; }

    setLoading(true);
    setError("");

    const res = await fetch("/api/inspection/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jurisdiction,
        inspectionType,
        address,
        propertyType,
        furnished,
        surfaceM2: surfaceM2 ? parseFloat(surfaceM2) : undefined,
        mainRooms: mainRooms ? parseInt(mainRooms, 10) : undefined,

        ownerType,
        ownerName: ownerName || undefined,
        ownerCompanyName: ownerCompanyName || undefined,
        ownerEmail: ownerEmail || undefined,
        ownerPhone: ownerPhone || undefined,
        ownerAddress: ownerAddress || undefined,

        tenants: tenants
          .filter((t) => t.fullName.trim())
          .map((t) => ({
            fullName: t.fullName.trim(),
            email: t.email.trim() || undefined,
            phone: t.phone.trim() || undefined,
          })),

        leaseStartDate: leaseStartDate || undefined,
        leaseEndDate: leaseEndDate || undefined,
        monthlyRentCents: monthlyRent ? Math.round(parseFloat(monthlyRent) * 100) : undefined,
        monthlyChargesCents: monthlyCharges ? Math.round(parseFloat(monthlyCharges) * 100) : undefined,

        // Canonical FR labels — DB stores a single language across locales.
        rooms: selectedRooms.map((r) => ({ type: r.type, label: r.label })),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? copy.errorGeneric);
      return;
    }

    router.push(`/inspection/${data.inspectionId}/capture`);
  }

  const noticeSuffix = furnished
    ? copy.noticeFurnishedSuffix
    : zoneTendueHint
      ? copy.noticeZoneTendueSuffix
      : "";

  return (
    <div className="min-h-screen bg-tenu-cream">
      <header className="flex items-center justify-between border-b border-tenu-cream-dark bg-white px-6 py-4">
        <Link href="/" className="text-xl font-bold text-tenu-forest">tenu</Link>
        <ProgressStepper steps={steps} currentStep="details" />
      </header>

      <main className="mx-auto max-w-lg px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold text-tenu-forest">{copy.pageTitle}</h1>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* ═══ SECTION 1: Type & Juridiction ═══ */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tenu-slate/70">
              {copy.sectionTypeTitle}
            </h2>

            {/* Inspection type: entrée / sortie */}
            <div className="flex gap-3">
              {([
                { value: "move_in" as const, label: copy.inspectionMoveIn },
                { value: "move_out" as const, label: copy.inspectionMoveOut },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setInspectionType(opt.value)}
                  className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                    inspectionType === opt.value
                      ? "border-tenu-forest bg-tenu-forest text-white"
                      : "border-tenu-cream-dark bg-white text-tenu-slate hover:border-tenu-forest/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Jurisdiction */}
            <div>
              <label className={labelClass}>{copy.countryLabel}</label>
              <div className="flex gap-3">
                {(["fr", "uk"] as const).map((j) => (
                  <button
                    key={j}
                    type="button"
                    onClick={() => setJurisdiction(j)}
                    className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                      jurisdiction === j
                        ? "border-tenu-forest bg-tenu-forest text-white"
                        : "border-tenu-cream-dark bg-white text-tenu-slate hover:border-tenu-forest/40"
                    }`}
                  >
                    {j === "fr" ? copy.countryFr : copy.countryUk}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ═══ SECTION 2: Bien immobilier ═══ */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tenu-slate/70">
              {copy.sectionPropertyTitle}
            </h2>

            {/* Address */}
            <div>
              <label htmlFor="address" className={labelClass}>
                {copy.addressLabel}
              </label>
              <input
                id="address"
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={copy.addressPlaceholder}
                className={inputClass}
              />
              {/* Zone tendue feedback */}
              {jurisdiction === "fr" && postalCode && (
                <p className={`mt-1 text-xs ${zoneTendueHint ? "text-tenu-warning" : "text-tenu-slate/50"}`}>
                  {zoneTendueHint
                    ? copy.zoneTendue(postalCode, noticePeriod)
                    : copy.zoneNonTendue(postalCode, noticePeriod)}
                </p>
              )}
            </div>

            {/* Property type + furnished */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{copy.propertyTypeLabel}</label>
                <div className="flex gap-2">
                  {([
                    { value: "appartement" as const, label: copy.propertyApartment },
                    { value: "maison" as const, label: copy.propertyHouse },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPropertyType(opt.value)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                        propertyType === opt.value
                          ? "border-tenu-forest bg-tenu-forest/10 text-tenu-forest"
                          : "border-tenu-cream-dark text-tenu-slate/60 hover:border-tenu-forest/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>{copy.furnishedLabel}</label>
                <div className="flex gap-2">
                  {([
                    { value: false, label: copy.furnishedNo },
                    { value: true, label: copy.furnishedYes },
                  ]).map((opt) => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setFurnished(opt.value)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                        furnished === opt.value
                          ? "border-tenu-forest bg-tenu-forest/10 text-tenu-forest"
                          : "border-tenu-cream-dark text-tenu-slate/60 hover:border-tenu-forest/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Surface + main rooms */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="surface" className={labelClass}>{copy.surfaceLabel}</label>
                <input
                  id="surface"
                  type="number"
                  step="0.1"
                  min="0"
                  value={surfaceM2}
                  onChange={(e) => setSurfaceM2(e.target.value)}
                  placeholder={copy.surfacePlaceholder}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="mainRooms" className={labelClass}>{copy.mainRoomsLabel}</label>
                <input
                  id="mainRooms"
                  type="number"
                  min="1"
                  max="20"
                  value={mainRooms}
                  onChange={(e) => setMainRooms(e.target.value)}
                  placeholder={copy.mainRoomsPlaceholder}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* ═══ SECTION 3: Propriétaire / Bailleur ═══ */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tenu-slate/70">
              {copy.sectionOwnerTitle}
            </h2>

            {/* Owner type */}
            <div className="flex gap-3">
              {([
                { value: "individual" as const, label: copy.ownerIndividual },
                { value: "company" as const, label: copy.ownerCompany },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setOwnerType(opt.value)}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    ownerType === opt.value
                      ? "border-tenu-forest bg-tenu-forest/10 text-tenu-forest"
                      : "border-tenu-cream-dark text-tenu-slate/60 hover:border-tenu-forest/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Owner name fields */}
            <div className={ownerType === "company" ? "grid grid-cols-2 gap-4" : ""}>
              <div>
                <label htmlFor="ownerName" className={labelClass}>
                  {ownerType === "company" ? copy.ownerNameCompany : copy.ownerNameIndividual}
                </label>
                <input
                  id="ownerName"
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder={ownerType === "company" ? copy.ownerNamePlaceholderCompany : copy.ownerNamePlaceholderIndividual}
                  className={inputClass}
                />
              </div>
              {ownerType === "company" && (
                <div>
                  <label htmlFor="ownerCompany" className={labelClass}>{copy.ownerCompanyLabel}</label>
                  <input
                    id="ownerCompany"
                    type="text"
                    value={ownerCompanyName}
                    onChange={(e) => setOwnerCompanyName(e.target.value)}
                    placeholder={copy.ownerCompanyPlaceholder}
                    className={inputClass}
                  />
                </div>
              )}
            </div>

            {/* Owner contact */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="ownerEmail" className={labelClass}>{copy.ownerEmailLabel}</label>
                <input
                  id="ownerEmail"
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder={copy.ownerEmailPlaceholder}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="ownerPhone" className={labelClass}>{copy.ownerPhoneLabel}</label>
                <input
                  id="ownerPhone"
                  type="tel"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  placeholder={copy.ownerPhonePlaceholder}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="ownerAddress" className={labelClass}>{copy.ownerAddressLabel}</label>
              <input
                id="ownerAddress"
                type="text"
                value={ownerAddress}
                onChange={(e) => setOwnerAddress(e.target.value)}
                placeholder={copy.ownerAddressPlaceholder}
                className={inputClass}
              />
            </div>
          </section>

          {/* ═══ SECTION 4: Locataire(s) ═══ */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-tenu-slate/70">
                {tenants.length > 1 ? copy.tenantTitlePlural : copy.tenantTitleSingular}
              </h2>
              {tenants.length < 3 && (
                <button
                  type="button"
                  onClick={addTenant}
                  className="text-xs font-medium text-tenu-forest hover:text-tenu-forest-light"
                >
                  {copy.addTenant}
                </button>
              )}
            </div>

            {tenants.map((tenant, idx) => (
              <div key={idx} className="space-y-3 rounded-lg border border-tenu-cream-dark bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-tenu-slate/50">
                    {copy.tenantNumber(idx + 1)}
                  </span>
                  {tenants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTenant(idx)}
                      className="text-xs text-tenu-danger hover:text-tenu-danger/80"
                    >
                      {copy.removeTenant}
                    </button>
                  )}
                </div>
                <div>
                  <label className={labelClass}>{copy.tenantFullNameLabel}</label>
                  <input
                    type="text"
                    required={idx === 0}
                    value={tenant.fullName}
                    onChange={(e) => updateTenant(idx, "fullName", e.target.value)}
                    placeholder={copy.tenantFullNamePlaceholder}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>{copy.tenantEmailLabel}</label>
                    <input
                      type="email"
                      value={tenant.email}
                      onChange={(e) => updateTenant(idx, "email", e.target.value)}
                      placeholder={copy.tenantEmailPlaceholder}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{copy.tenantPhoneLabel}</label>
                    <input
                      type="tel"
                      value={tenant.phone}
                      onChange={(e) => updateTenant(idx, "phone", e.target.value)}
                      placeholder={copy.tenantPhonePlaceholder}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            ))}
            {tenants.length >= 3 && (
              <p className="text-xs text-tenu-slate/40">{copy.tenantMaxNote}</p>
            )}
          </section>

          {/* ═══ SECTION 5: Contrat ═══ */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tenu-slate/70">
              {copy.sectionLeaseTitle}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="leaseStart" className={labelClass}>{copy.leaseStartLabel}</label>
                <input
                  id="leaseStart"
                  type="date"
                  value={leaseStartDate}
                  onChange={(e) => setLeaseStartDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="leaseEnd" className={labelClass}>{copy.leaseEndLabel}</label>
                <input
                  id="leaseEnd"
                  type="date"
                  value={leaseEndDate}
                  onChange={(e) => setLeaseEndDate(e.target.value)}
                  className={inputClass}
                />
                <p className="mt-0.5 text-[10px] text-tenu-slate/40">{copy.leaseEndHint}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="rent" className={labelClass}>
                  {copy.rentLabel(currency)}
                </label>
                <input
                  id="rent"
                  type="number"
                  step="0.01"
                  min="0"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  placeholder={copy.rentPlaceholder}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="charges" className={labelClass}>
                  {copy.chargesLabel(currency)}
                </label>
                <input
                  id="charges"
                  type="number"
                  step="0.01"
                  min="0"
                  value={monthlyCharges}
                  onChange={(e) => setMonthlyCharges(e.target.value)}
                  placeholder={copy.chargesPlaceholder}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Notice period display */}
            {jurisdiction === "fr" && (
              <p className="text-xs text-tenu-slate/60">
                {copy.noticePeriod(noticePeriod, noticeSuffix)}
              </p>
            )}
          </section>

          {/* ═══ SECTION 6: Pièces à inspecter ═══ */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tenu-slate/70">
              {copy.sectionRoomsTitle}
            </h2>

            {/* Base rooms */}
            <div>
              <p className="mb-2 text-xs text-tenu-slate/50">{copy.roomsBaseHeader}</p>
              <div className="flex flex-wrap gap-2">
                {ROOM_OPTIONS.filter((r) => r.category === "base").map((room) => (
                  <button
                    key={room.type}
                    type="button"
                    onClick={() => toggleRoom(room)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      selectedRooms.find((r) => r.type === room.type)
                        ? "border-tenu-forest bg-tenu-forest/10 text-tenu-forest"
                        : "border-tenu-cream-dark text-tenu-slate/60 hover:border-tenu-forest/40"
                    }`}
                  >
                    {copy.roomLabels[room.type] ?? room.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Extra rooms */}
            <div>
              <p className="mb-2 text-xs text-tenu-slate/50">{copy.roomsExtraHeader(currency)}</p>
              <div className="flex flex-wrap gap-2">
                {ROOM_OPTIONS.filter((r) => r.category === "extra").map((room) => (
                  <button
                    key={room.type}
                    type="button"
                    onClick={() => toggleRoom(room)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      selectedRooms.find((r) => r.type === room.type)
                        ? "border-tenu-forest bg-tenu-forest/10 text-tenu-forest"
                        : "border-tenu-cream-dark text-tenu-slate/60 hover:border-tenu-forest/40"
                    }`}
                  >
                    {copy.roomLabels[room.type] ?? room.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Parties privatives */}
            <div>
              <p className="mb-2 text-xs text-tenu-slate/50">{copy.roomsPrivativeHeader(currency)}</p>
              <div className="flex flex-wrap gap-2">
                {ROOM_OPTIONS.filter((r) => r.category === "privative").map((room) => (
                  <button
                    key={room.type}
                    type="button"
                    onClick={() => toggleRoom(room)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      selectedRooms.find((r) => r.type === room.type)
                        ? "border-tenu-forest bg-tenu-forest/10 text-tenu-forest"
                        : "border-tenu-cream-dark text-tenu-slate/60 hover:border-tenu-forest/40"
                    }`}
                  >
                    {copy.roomLabels[room.type] ?? room.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ═══ Error + Submit ═══ */}
          {error && <p className="text-sm text-tenu-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-tenu-forest px-4 py-3 text-sm font-medium text-white hover:bg-tenu-forest-light disabled:opacity-50"
          >
            {loading ? copy.submitLoading : copy.submitIdle}
          </button>
        </form>
      </main>
    </div>
  );
}
