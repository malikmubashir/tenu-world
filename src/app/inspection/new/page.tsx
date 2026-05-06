"use client";

/**
 * NewInspectionPage — Multi-section form to create a new inspection.
 *
 * Collects: jurisdiction, inspection type, property details, owner info,
 * tenant(s) (1–3), contract details, room selection.
 * Zone tendue auto-detected from postal code (FR only).
 * French is the primary UI language per product spec.
 */

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProgressStepper from "@/components/ui/ProgressStepper";

const steps = [
  { key: "details", label: "Détails" },
  { key: "capture", label: "Photos" },
  { key: "review", label: "Vérification" },
  { key: "report", label: "Rapport" },
];

/* ── Room definitions matching the API and état des lieux spec ── */

interface RoomOption {
  type: string;
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

/* ── Component ── */

export default function NewInspectionPage() {
  const router = useRouter();

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
    if (!address.trim()) { setError("L'adresse est obligatoire"); return; }
    if (selectedRooms.length === 0) { setError("Sélectionnez au moins une pièce"); return; }
    if (!tenants[0].fullName.trim()) { setError("Le nom du locataire est obligatoire"); return; }

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

        rooms: selectedRooms.map((r) => ({ type: r.type, label: r.label })),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.status === 403 && data.code === "DPA_REQUIRED") {
      router.push("/auth/accept-terms?redirect=/inspection/new");
      return;
    }

    if (!res.ok) {
      setError(data.error ?? "Une erreur est survenue");
      return;
    }

    router.push(`/inspection/${data.inspectionId}/capture`);
  }

  return (
    <div className="min-h-screen bg-tenu-cream">
      <header className="flex items-center justify-between border-b border-tenu-cream-dark bg-white px-6 py-4">
        <Link href="/" className="text-xl font-bold text-tenu-forest">tenu</Link>
        <ProgressStepper steps={steps} currentStep="details" />
      </header>

      <main className="mx-auto max-w-lg px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold text-tenu-forest">Nouvel état des lieux</h1>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* ═══ SECTION 1: Type & Juridiction ═══ */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tenu-slate/70">
              Type d&apos;inspection
            </h2>

            {/* Inspection type: entrée / sortie */}
            <div className="flex gap-3">
              {([
                { value: "move_in" as const, label: "État des lieux d'entrée" },
                { value: "move_out" as const, label: "État des lieux de sortie" },
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
              <label className={labelClass}>Pays</label>
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
                    {j === "fr" ? "France" : "Royaume-Uni"}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ═══ SECTION 2: Bien immobilier ═══ */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tenu-slate/70">
              Le bien
            </h2>

            {/* Address */}
            <div>
              <label htmlFor="address" className={labelClass}>
                Adresse du bien
              </label>
              <input
                id="address"
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Rue de la Paix, 75002 Paris"
                className={inputClass}
              />
              {/* Zone tendue feedback */}
              {jurisdiction === "fr" && postalCode && (
                <p className={`mt-1 text-xs ${zoneTendueHint ? "text-tenu-warning" : "text-tenu-slate/50"}`}>
                  {zoneTendueHint
                    ? `Zone tendue (${postalCode}) — préavis ${noticePeriod} mois`
                    : `Zone non tendue (${postalCode}) — préavis ${noticePeriod} mois`}
                </p>
              )}
            </div>

            {/* Property type + furnished */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Type de bien</label>
                <div className="flex gap-2">
                  {([
                    { value: "appartement" as const, label: "Appartement" },
                    { value: "maison" as const, label: "Maison" },
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
                <label className={labelClass}>Meublé</label>
                <div className="flex gap-2">
                  {([
                    { value: false, label: "Non meublé" },
                    { value: true, label: "Meublé" },
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
                <label htmlFor="surface" className={labelClass}>Surface (m²)</label>
                <input
                  id="surface"
                  type="number"
                  step="0.1"
                  min="0"
                  value={surfaceM2}
                  onChange={(e) => setSurfaceM2(e.target.value)}
                  placeholder="45"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="mainRooms" className={labelClass}>Pièces principales</label>
                <input
                  id="mainRooms"
                  type="number"
                  min="1"
                  max="20"
                  value={mainRooms}
                  onChange={(e) => setMainRooms(e.target.value)}
                  placeholder="2"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* ═══ SECTION 3: Propriétaire / Bailleur ═══ */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tenu-slate/70">
              Propriétaire / Bailleur
            </h2>

            {/* Owner type */}
            <div className="flex gap-3">
              {([
                { value: "individual" as const, label: "Particulier" },
                { value: "company" as const, label: "Société / Agence" },
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
                  {ownerType === "company" ? "Nom du représentant" : "Nom complet"}
                </label>
                <input
                  id="ownerName"
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder={ownerType === "company" ? "M. Dupont" : "Mme Martin"}
                  className={inputClass}
                />
              </div>
              {ownerType === "company" && (
                <div>
                  <label htmlFor="ownerCompany" className={labelClass}>Raison sociale</label>
                  <input
                    id="ownerCompany"
                    type="text"
                    value={ownerCompanyName}
                    onChange={(e) => setOwnerCompanyName(e.target.value)}
                    placeholder="SCI Martin Immobilier"
                    className={inputClass}
                  />
                </div>
              )}
            </div>

            {/* Owner contact */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="ownerEmail" className={labelClass}>Email</label>
                <input
                  id="ownerEmail"
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="proprietaire@email.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="ownerPhone" className={labelClass}>Téléphone</label>
                <input
                  id="ownerPhone"
                  type="tel"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  placeholder="06 12 34 56 78"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="ownerAddress" className={labelClass}>Adresse postale du bailleur</label>
              <input
                id="ownerAddress"
                type="text"
                value={ownerAddress}
                onChange={(e) => setOwnerAddress(e.target.value)}
                placeholder="Pour la lettre de contestation"
                className={inputClass}
              />
            </div>
          </section>

          {/* ═══ SECTION 4: Locataire(s) ═══ */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-tenu-slate/70">
                Locataire{tenants.length > 1 ? "s" : ""}
              </h2>
              {tenants.length < 3 && (
                <button
                  type="button"
                  onClick={addTenant}
                  className="text-xs font-medium text-tenu-forest hover:text-tenu-forest-light"
                >
                  + Ajouter un locataire
                </button>
              )}
            </div>

            {tenants.map((tenant, idx) => (
              <div key={idx} className="space-y-3 rounded-lg border border-tenu-cream-dark bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-tenu-slate/50">
                    Locataire {idx + 1}
                  </span>
                  {tenants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTenant(idx)}
                      className="text-xs text-tenu-danger hover:text-tenu-danger/80"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Nom complet *</label>
                  <input
                    type="text"
                    required={idx === 0}
                    value={tenant.fullName}
                    onChange={(e) => updateTenant(idx, "fullName", e.target.value)}
                    placeholder="Prénom Nom"
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Email</label>
                    <input
                      type="email"
                      value={tenant.email}
                      onChange={(e) => updateTenant(idx, "email", e.target.value)}
                      placeholder="locataire@email.com"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Téléphone</label>
                    <input
                      type="tel"
                      value={tenant.phone}
                      onChange={(e) => updateTenant(idx, "phone", e.target.value)}
                      placeholder="06 00 00 00 00"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            ))}
            {tenants.length >= 3 && (
              <p className="text-xs text-tenu-slate/40">Maximum 3 locataires par inspection</p>
            )}
          </section>

          {/* ═══ SECTION 5: Contrat ═══ */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tenu-slate/70">
              Contrat de bail
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="leaseStart" className={labelClass}>Date de début</label>
                <input
                  id="leaseStart"
                  type="date"
                  value={leaseStartDate}
                  onChange={(e) => setLeaseStartDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="leaseEnd" className={labelClass}>Date de fin</label>
                <input
                  id="leaseEnd"
                  type="date"
                  value={leaseEndDate}
                  onChange={(e) => setLeaseEndDate(e.target.value)}
                  className={inputClass}
                />
                <p className="mt-0.5 text-[10px] text-tenu-slate/40">Laisser vide si durée indéterminée</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="rent" className={labelClass}>
                  Loyer mensuel ({jurisdiction === "fr" ? "€" : "£"})
                </label>
                <input
                  id="rent"
                  type="number"
                  step="0.01"
                  min="0"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  placeholder="800.00"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="charges" className={labelClass}>
                  Charges ({jurisdiction === "fr" ? "€" : "£"})
                </label>
                <input
                  id="charges"
                  type="number"
                  step="0.01"
                  min="0"
                  value={monthlyCharges}
                  onChange={(e) => setMonthlyCharges(e.target.value)}
                  placeholder="50.00"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Notice period display */}
            {jurisdiction === "fr" && (
              <p className="text-xs text-tenu-slate/60">
                Préavis de départ : {noticePeriod} mois
                {furnished ? " (meublé)" : zoneTendueHint ? " (zone tendue)" : ""}
              </p>
            )}
          </section>

          {/* ═══ SECTION 6: Pièces à inspecter ═══ */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tenu-slate/70">
              Pièces à inspecter
            </h2>

            {/* Base rooms */}
            <div>
              <p className="mb-2 text-xs text-tenu-slate/50">Pièces principales (incluses)</p>
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
                    {room.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Extra rooms */}
            <div>
              <p className="mb-2 text-xs text-tenu-slate/50">Pièces supplémentaires (+5{jurisdiction === "fr" ? "€" : "£"} chacune)</p>
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
                    {room.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Parties privatives */}
            <div>
              <p className="mb-2 text-xs text-tenu-slate/50">Parties privatives (+5{jurisdiction === "fr" ? "€" : "£"} chacune)</p>
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
                    {room.label}
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
            {loading ? "Création en cours..." : "Commencer les photos"}
          </button>
        </form>
      </main>
    </div>
  );
}
