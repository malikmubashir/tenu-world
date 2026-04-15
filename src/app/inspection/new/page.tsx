"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProgressStepper from "@/components/ui/ProgressStepper";
import type { RoomType } from "@/components/camera/RoomSelector";

const steps = [
  { key: "details", label: "Details" },
  { key: "capture", label: "Capture" },
  { key: "review", label: "Review" },
  { key: "report", label: "Report" },
];

const defaultRooms: { type: RoomType; label: string }[] = [
  { type: "kitchen", label: "Kitchen" },
  { type: "bathroom", label: "Bathroom" },
  { type: "bedroom", label: "Bedroom" },
  { type: "living", label: "Living room" },
  { type: "hallway", label: "Hallway" },
];

export default function NewInspectionPage() {
  const router = useRouter();
  const [jurisdiction, setJurisdiction] = useState<"fr" | "uk">("fr");
  const [address, setAddress] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [moveOutDate, setMoveOutDate] = useState("");
  const [selectedRooms, setSelectedRooms] = useState<{ type: RoomType; label: string }[]>(defaultRooms);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleRoom(room: { type: RoomType; label: string }) {
    setSelectedRooms((prev) =>
      prev.find((r) => r.type === room.type)
        ? prev.filter((r) => r.type !== room.type)
        : [...prev, room],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) {
      setError("Address is required");
      return;
    }
    if (selectedRooms.length === 0) {
      setError("Select at least one room");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/inspection/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jurisdiction,
        address,
        moveInDate: moveInDate || undefined,
        moveOutDate: moveOutDate || undefined,
        rooms: selectedRooms,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
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

      <main className="mx-auto max-w-lg px-6 py-10">
        <h1 className="mb-6 text-2xl font-bold text-tenu-forest">New inspection</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Jurisdiction */}
          <div>
            <label className="mb-2 block text-sm font-medium text-tenu-slate">
              Where is your property?
            </label>
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
                  {j === "fr" ? "France" : "United Kingdom"}
                </button>
              ))}
            </div>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="mb-1 block text-sm font-medium text-tenu-slate">
              Property address
            </label>
            <input
              id="address"
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Rue de la Paix, 75002 Paris"
              className="w-full rounded-lg border border-tenu-cream-dark px-3 py-2 text-sm outline-none focus:border-tenu-forest focus:ring-1 focus:ring-tenu-forest"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="moveIn" className="mb-1 block text-sm font-medium text-tenu-slate">
                Move-in date
              </label>
              <input
                id="moveIn"
                type="date"
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
                className="w-full rounded-lg border border-tenu-cream-dark px-3 py-2 text-sm outline-none focus:border-tenu-forest"
              />
            </div>
            <div>
              <label htmlFor="moveOut" className="mb-1 block text-sm font-medium text-tenu-slate">
                Move-out date
              </label>
              <input
                id="moveOut"
                type="date"
                value={moveOutDate}
                onChange={(e) => setMoveOutDate(e.target.value)}
                className="w-full rounded-lg border border-tenu-cream-dark px-3 py-2 text-sm outline-none focus:border-tenu-forest"
              />
            </div>
          </div>

          {/* Rooms */}
          <div>
            <label className="mb-2 block text-sm font-medium text-tenu-slate">
              Select rooms to inspect
            </label>
            <div className="flex flex-wrap gap-2">
              {[...defaultRooms, { type: "balcony" as RoomType, label: "Balcony" }, { type: "other" as RoomType, label: "Other" }].map((room) => (
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

          {error && <p className="text-sm text-tenu-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-tenu-forest px-4 py-3 text-sm font-medium text-white hover:bg-tenu-forest-light disabled:opacity-50"
          >
            {loading ? "Creating..." : "Start photo capture"}
          </button>
        </form>
      </main>
    </div>
  );
}
