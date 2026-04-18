"use client";

/**
 * New inspection — minimal form for the mobile scaffold.
 *
 * Captures: address, inspection type (entrée / sortie), rooms.
 * Saves a draft immediately so photo capture can start offline, then
 * queues the full submission when the user taps "Terminer et envoyer".
 *
 * The full zone-tendue lookup, tenant/owner detail, contract dates etc.
 * are deliberately out of scope for the non-production mobile base.
 * They exist on the web flow and can be ported step by step once this
 * skeleton is proven to work on device.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/mobile/NavBar";
import HIGButton from "@/components/mobile/HIGButton";
import HIGTextField from "@/components/mobile/HIGTextField";
import {
  newDraftId,
  saveDraft,
  type InspectionDraft,
} from "@/lib/mobile/storage/drafts";

type InspectionType = "entree" | "sortie";

const ROOMS = [
  { id: "entree", label: "Entrée" },
  { id: "salon", label: "Salon" },
  { id: "cuisine", label: "Cuisine" },
  { id: "chambre", label: "Chambre" },
  { id: "salle_de_bain", label: "Salle de bain" },
  { id: "wc", label: "WC" },
];

export default function NewInspectionPage() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [type, setType] = useState<InspectionType>("entree");
  const [selectedRooms, setSelectedRooms] = useState<string[]>([
    "salon",
    "cuisine",
    "chambre",
    "salle_de_bain",
  ]);
  const [saving, setSaving] = useState(false);

  const toggleRoom = (id: string) => {
    setSelectedRooms((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleStart = async () => {
    if (!address.trim() || selectedRooms.length === 0) return;
    setSaving(true);
    const draft: InspectionDraft = {
      id: newDraftId(),
      payload: {
        address: address.trim(),
        type,
        rooms: selectedRooms,
        locale: "fr",
      },
      updatedAt: Date.now(),
      syncedAt: null,
    };
    try {
      await saveDraft(draft);
      router.push(`/app-home/inspection/${draft.id}`);
    } finally {
      setSaving(false);
    }
  };

  const valid = address.trim().length >= 5 && selectedRooms.length > 0;

  return (
    <>
      <NavBar title="Nouveau constat" />
      <div className="flex flex-1 flex-col gap-6 px-4 pb-8 pt-4">
        <section className="flex flex-col gap-4">
          <HIGTextField
            label="Adresse du logement"
            placeholder="12 rue de Rivoli, 75001 Paris"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            autoComplete="street-address"
          />
        </section>

        <section className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-tenu-slate/70">
            Type de constat
          </span>
          <div className="grid grid-cols-2 gap-2">
            <SegmentedOption
              active={type === "entree"}
              onSelect={() => setType("entree")}
              label="Entrée"
              hint="État des lieux d'entrée"
            />
            <SegmentedOption
              active={type === "sortie"}
              onSelect={() => setType("sortie")}
              label="Sortie"
              hint="État des lieux de sortie"
            />
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-tenu-slate/70">
            Pièces à inspecter
          </span>
          <div className="grid grid-cols-2 gap-2">
            {ROOMS.map((r) => (
              <RoomChip
                key={r.id}
                label={r.label}
                active={selectedRooms.includes(r.id)}
                onToggle={() => toggleRoom(r.id)}
              />
            ))}
          </div>
        </section>

        <div className="mt-auto">
          <HIGButton
            onClick={handleStart}
            disabled={!valid}
            loading={saving}
          >
            Commencer le constat
          </HIGButton>
          <p className="mt-2 text-center text-[11px] text-tenu-slate/50">
            Le brouillon est enregistré localement. Rien n'est envoyé tant que
            vous n'appuyez pas sur « Terminer ».
          </p>
        </div>
      </div>
    </>
  );
}

function SegmentedOption({
  active,
  label,
  hint,
  onSelect,
}: {
  active: boolean;
  label: string;
  hint: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        "flex min-h-[56px] flex-col items-start justify-center rounded-xl px-4 text-left " +
        (active
          ? "bg-tenu-forest text-tenu-cream"
          : "bg-white/70 text-tenu-slate active:bg-white")
      }
    >
      <span className="text-base font-semibold">{label}</span>
      <span className={active ? "text-xs text-tenu-cream/80" : "text-xs text-tenu-slate/60"}>
        {hint}
      </span>
    </button>
  );
}

function RoomChip({
  active,
  label,
  onToggle,
}: {
  active: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={
        "min-h-[44px] rounded-xl px-4 text-sm font-medium " +
        (active
          ? "bg-tenu-forest text-tenu-cream"
          : "bg-white/70 text-tenu-slate active:bg-white")
      }
    >
      {label}
    </button>
  );
}
