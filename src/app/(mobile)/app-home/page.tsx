"use client";

/**
 * Mobile home — lists local drafts + a big "Nouveau constat" CTA.
 * This is the default tab.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { listDrafts, type InspectionDraft } from "@/lib/mobile/storage/drafts";
import NavBar from "@/components/mobile/NavBar";
import HIGButton from "@/components/mobile/HIGButton";
import { platformName } from "@/lib/mobile/platform";

export default function AppHomePage() {
  const [drafts, setDrafts] = useState<InspectionDraft[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void listDrafts().then((rows) => {
      setDrafts(rows);
      setLoaded(true);
    });
  }, []);

  return (
    <>
      <NavBar title="Tenu" showBack={false} />
      <div className="flex flex-1 flex-col px-4 pb-6 pt-4">
        <h2 className="text-2xl font-bold text-tenu-slate">Bonjour.</h2>
        <p className="mt-1 text-sm text-tenu-slate/70">
          Commencez un nouveau constat ou reprenez un brouillon.
        </p>

        <div className="mt-6">
          <Link href="/app-home/inspection/new" className="block">
            <HIGButton leading={<Plus className="h-5 w-5" />}>
              Nouveau constat
            </HIGButton>
          </Link>
        </div>

        <section className="mt-8 flex-1">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-tenu-slate/60">
            Brouillons
          </h3>
          {!loaded ? (
            <p className="text-sm text-tenu-slate/60">Chargement…</p>
          ) : drafts.length === 0 ? (
            <p className="rounded-xl bg-white/60 p-4 text-sm text-tenu-slate/70">
              Aucun brouillon. Lancez un constat pour commencer.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {drafts.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/app-home/inspection/${d.id}`}
                    className="block rounded-xl bg-white/70 px-4 py-3 active:bg-white"
                  >
                    <p className="font-medium text-tenu-slate">
                      {draftTitle(d)}
                    </p>
                    <p className="text-xs text-tenu-slate/60">
                      {formatRelative(d.updatedAt)}
                      {d.syncedAt ? " · synchronisé" : " · local"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="mt-6 text-center text-[11px] text-tenu-slate/40">
          Plateforme: {platformName()}
        </footer>
      </div>
    </>
  );
}

function draftTitle(d: InspectionDraft): string {
  const addr = (d.payload as { address?: string }).address;
  if (typeof addr === "string" && addr.length > 0) return addr;
  return "Brouillon sans adresse";
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}
