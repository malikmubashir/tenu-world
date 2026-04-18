"use client";

import NavBar from "@/components/mobile/NavBar";

/**
 * Reports tab stub. The full implementation fetches the user's scan
 * verdicts + dispute letters from tenu.world/api/reports and renders
 * them as a list with PDF open buttons. Deferred.
 */
export default function ReportsPage() {
  return (
    <>
      <NavBar title="Rapports" showBack={false} />
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <p className="text-base font-semibold text-tenu-slate">Aucun rapport</p>
        <p className="mt-2 text-sm text-tenu-slate/60">
          Vos rapports d'analyse apparaîtront ici après le traitement
          d'un constat.
        </p>
      </div>
    </>
  );
}
