import type { Metadata } from "next";
import Link from "next/link";
import CookiePreferencesResetter from "./CookiePreferencesResetter";

export const metadata: Metadata = {
  title: "Politique cookies",
  description:
    "Politique relative aux cookies et traceurs utilisés par Tenu.World.",
  robots: { index: true, follow: true },
};

/**
 * Cookie policy — FR version. Referenced from the cookie banner
 * "Gérer mes choix" link. Lists categories and gives the user a way
 * to re-open the banner to change their decision.
 */
export default function CookiePolicyFrPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 text-tenu-slate">
      <header className="mb-8">
        <Link href="/" className="text-xl font-bold text-tenu-forest">
          tenu
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-tenu-forest">
          Politique cookies
        </h1>
        <p className="mt-1 text-sm text-tenu-slate/60">
          Dernière mise à jour : 17 avril 2026 · version v1.0-2026-04-17
        </p>
      </header>

      <section className="space-y-5 text-sm leading-relaxed">
        <p>
          Tenu.World utilise des cookies et technologies similaires pour
          faire fonctionner le service, mesurer son usage et améliorer
          votre expérience. Cette page décrit les catégories utilisées
          et comment vous pouvez les contrôler.
        </p>

        <h2 className="mt-6 text-lg font-semibold text-tenu-forest">
          1. Cookies strictement nécessaires
        </h2>
        <p>
          Indispensables au fonctionnement du service : session
          d&apos;authentification, préférences de langue, protection
          anti-CSRF, panier de paiement. Ils ne requièrent pas votre
          consentement (art. 82 Loi Informatique et Libertés,
          exemption).
        </p>

        <h2 className="mt-6 text-lg font-semibold text-tenu-forest">
          2. Cookies de mesure d&apos;audience
        </h2>
        <p>
          Nous permettent de comprendre comment le service est utilisé,
          d&apos;identifier les pages lentes et de corriger les bugs.
          Ces cookies ne sont posés qu&apos;après votre accord explicite.
        </p>

        <h2 className="mt-6 text-lg font-semibold text-tenu-forest">
          3. Cookies marketing et tiers
        </h2>
        <p>
          Utilisés pour mesurer l&apos;efficacité de nos campagnes et
          proposer des contenus pertinents. Désactivés par défaut,
          activés uniquement si vous cliquez &laquo;&nbsp;Tout
          accepter&nbsp;&raquo; dans le bandeau.
        </p>

        <h2 className="mt-6 text-lg font-semibold text-tenu-forest">
          4. Modifier vos préférences
        </h2>
        <p>
          Vous pouvez à tout moment changer d&apos;avis. Utilisez le
          bouton ci-dessous pour réafficher le bandeau de choix.
        </p>

        <CookiePreferencesResetter locale="fr" />

        <h2 className="mt-6 text-lg font-semibold text-tenu-forest">
          5. Base légale et durée
        </h2>
        <p>
          Base légale : consentement (GDPR art. 6.1.a) pour les cookies
          non-essentiels, intérêt légitime (art. 6.1.f) et exécution
          contractuelle (art. 6.1.b) pour les cookies strictement
          nécessaires. Durée maximale : 13 mois (recommandation CNIL).
        </p>

        <h2 className="mt-6 text-lg font-semibold text-tenu-forest">
          6. Contact
        </h2>
        <p>
          Pour toute question relative aux cookies :{" "}
          <a href="mailto:dpo@tenu.world" className="text-tenu-forest underline">
            dpo@tenu.world
          </a>
          .
        </p>
      </section>

      <footer className="mt-10 border-t border-tenu-cream-dark pt-6 text-xs text-tenu-slate/60">
        <Link href="/legal/privacy/fr" className="underline hover:no-underline">
          Politique de confidentialité
        </Link>
        {" · "}
        <Link href="/legal/terms/fr" className="underline hover:no-underline">
          Conditions d&apos;utilisation
        </Link>
      </footer>
    </main>
  );
}
