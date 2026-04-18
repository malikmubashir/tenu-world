/**
 * Inspection draft page — server-component wrapper.
 *
 * The interactive UI is a client component (InspectionDraftView). This
 * wrapper exists only so Next.js sees a server-component page.tsx and
 * can honour `generateStaticParams` — a constraint of `output: 'export'`
 * builds (MOBILE_BUILD=1).
 *
 * At build time we emit one placeholder HTML shell. Real inspection
 * IDs are reached via client-side router.push() after draft creation;
 * history.pushState does not trigger an HTTP fetch, so the absence of
 * a matching HTML file at /app-home/inspection/<realId>/ is benign —
 * the already-loaded JS chunk re-renders with the new useParams().
 */
import InspectionDraftView from "./InspectionDraftView";

export function generateStaticParams() {
  return [{ id: "_placeholder" }];
}

export default function InspectionDraftPage() {
  return <InspectionDraftView />;
}
