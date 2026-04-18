"use client";

/**
 * Settings tab. Minimal for the scaffold: platform info, link to legal
 * pages on tenu.world, sign-out stub. Account management, language,
 * cookie preferences and consent history are deferred.
 */
import { useEffect, useState } from "react";
import NavBar from "@/components/mobile/NavBar";
import HIGButton from "@/components/mobile/HIGButton";
import { platformName, isNative } from "@/lib/mobile/platform";
import { stuckCount } from "@/lib/mobile/storage/uploadQueue";

export default function SettingsPage() {
  const [stuck, setStuck] = useState(0);

  useEffect(() => {
    void stuckCount().then(setStuck);
  }, []);

  const openLegal = (slug: string) => {
    const url = `https://tenu.world/legal/${slug}`;
    if (typeof window !== "undefined") {
      window.open(url, "_system");
    }
  };

  return (
    <>
      <NavBar title="Réglages" showBack={false} />
      <div className="flex flex-1 flex-col gap-6 px-4 py-4">
        <Section title="Compte">
          <Row label="Plateforme" value={platformName()} />
          <Row label="Envois bloqués" value={stuck > 0 ? `${stuck}` : "aucun"} />
        </Section>

        <Section title="Juridique">
          <LinkRow label="Conditions d'utilisation" onClick={() => openLegal("terms")} />
          <LinkRow label="Politique de confidentialité" onClick={() => openLegal("privacy")} />
          <LinkRow label="Mentions légales" onClick={() => openLegal("mentions")} />
        </Section>

        {isNative() && (
          <HIGButton
            variant="secondary"
            onClick={() => {
              // Sign-out stub — will call /api/auth/signout once the
              // mobile auth layer is wired.
              alert("La déconnexion mobile sera activée en Semaine 5.");
            }}
          >
            Se déconnecter
          </HIGButton>
        )}

        <p className="mt-auto pb-4 text-center text-[11px] text-tenu-slate/40">
          Tenu · version pré-lancement
        </p>
      </div>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-tenu-slate/60">
        {title}
      </h3>
      <div className="flex flex-col overflow-hidden rounded-xl bg-white/70">
        {children}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-tenu-cream-dark/40 px-4 py-3 last:border-b-0">
      <span className="text-sm text-tenu-slate">{label}</span>
      <span className="text-sm text-tenu-slate/60">{value}</span>
    </div>
  );
}

function LinkRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between border-b border-tenu-cream-dark/40 px-4 py-3 text-left last:border-b-0 active:bg-white"
    >
      <span className="text-sm text-tenu-slate">{label}</span>
      <span className="text-sm text-tenu-slate/40">›</span>
    </button>
  );
}
