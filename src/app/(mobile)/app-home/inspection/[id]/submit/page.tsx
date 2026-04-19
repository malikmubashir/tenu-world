/**
 * Submit page — server wrapper.
 *
 * Same generateStaticParams placeholder pattern as the parent
 * /app-home/inspection/[id]/page.tsx. The interactive UI lives in
 * SubmitFlow.tsx (client component).
 */
import SubmitFlow from "./SubmitFlow";

export function generateStaticParams() {
  return [{ id: "_placeholder" }];
}

export default function InspectionSubmitPage() {
  return <SubmitFlow />;
}
