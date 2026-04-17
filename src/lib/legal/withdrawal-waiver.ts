/**
 * 14-day droit de rétractation waiver text (FR + EN).
 *
 * Legal basis:
 *   - Art. L221-18 Code de la consommation: 14-day withdrawal right
 *     for B2C distance contracts.
 *   - Art. L221-28 1° CConso: exception for digital content not
 *     supplied on a tangible medium, when (a) execution begins with
 *     the consumer's prior express consent AND (b) the consumer
 *     expressly waives their withdrawal right.
 *
 * Both conditions must be ticked at checkout. Without BOTH, the
 * service cannot start and the card is not charged.
 *
 * Text version is frozen here. Any wording change MUST bump
 * WAIVER_TEXT_VERSION so the consents table records which revision
 * the user agreed to. Git history is our audit trail.
 *
 * DO NOT translate this file through an LLM. Any edit requires avocat
 * review and a version bump.
 */

export const WAIVER_TEXT_VERSION = "v1.0-2026-04-17";

export interface WaiverCopy {
  /** Short framing line shown above the two checkboxes */
  intro: string;
  /** Checkbox 1: prior express consent to immediate execution */
  priorConsentLabel: string;
  /** Checkbox 2: express waiver of the 14-day right */
  waiverLabel: string;
  /** Link text pointing to the refund policy */
  refundLinkLabel: string;
  /** Hint shown when buttons are still disabled */
  hint: string;
}

export const WAIVER_COPY: Record<"fr" | "en", WaiverCopy> = {
  fr: {
    intro:
      "Avant de procéder au paiement, vous devez confirmer deux points. Ce service est un contenu numérique. Dès que vous cochez ces cases et payez, nous lançons immédiatement la génération de votre rapport et vous perdez votre droit de rétractation de quatorze jours (art. L221-28 1° du Code de la consommation).",
    priorConsentLabel:
      "Je demande l'exécution immédiate du service et j'accepte que la génération du rapport commence dès le paiement, avant la fin du délai de rétractation de quatorze jours.",
    waiverLabel:
      "Je reconnais expressément perdre mon droit de rétractation dès la délivrance du rapport.",
    refundLinkLabel: "Voir la politique de remboursement",
    hint: "Les deux cases doivent être cochées pour continuer vers le paiement.",
  },
  en: {
    intro:
      "Before payment, please confirm two points. This service is digital content. As soon as you tick these boxes and pay, we immediately start generating your report and you lose your 14-day withdrawal right (art. L221-28 1°, French Consumer Code).",
    priorConsentLabel:
      "I request immediate execution of the service and agree that report generation starts at payment, before the end of the 14-day withdrawal period.",
    waiverLabel:
      "I expressly acknowledge that I lose my right of withdrawal upon delivery of the report.",
    refundLinkLabel: "View refund policy",
    hint: "Both boxes must be ticked to continue to payment.",
  },
};

/**
 * Payload shape the frontend sends to /api/checkout to prove the
 * user actively ticked both boxes. Backend validates BEFORE creating
 * the Stripe session and records a consents row.
 */
export interface WaiverConsentPayload {
  priorConsent: boolean;
  waiver: boolean;
  locale: "fr" | "en";
  textVersion: string;
}

/** True if both checkboxes are ticked and version matches current. */
export function isValidWaiverPayload(p: unknown): p is WaiverConsentPayload {
  if (!p || typeof p !== "object") return false;
  const c = p as Record<string, unknown>;
  return (
    c.priorConsent === true &&
    c.waiver === true &&
    (c.locale === "fr" || c.locale === "en") &&
    c.textVersion === WAIVER_TEXT_VERSION
  );
}
