// Legal notice (v1.0, 2026-06-12). Source: RGPD V6 document validated by the DPO (AP3R Consulting).
// French LCEN art. 6-III: identification of publisher, publication director and host.
import LegalPage from "@/components/legal/LegalPage";
import { H2, P } from "@/components/legal/Prose";

export const metadata = {
  title: "Legal Notice — Tenu.World",
  description: "Identification of the publisher, publication director and host of Tenu.World.",
};

export default function MentionsEN() {
  return (
    <LegalPage
      meta={{
        title: "Legal Notice",
        version: "v1.0",
        lastUpdated: "2026-06-12",
        statusLine: "v1.0 — DPO validated (AP3R Consulting, 12 June 2026)",
        localeLabel: "English",
        otherLocaleHref: "/legal/mentions/fr",
        otherLocaleLabel: "Français",
        backToIndex: "Legal documents",
      }}
    >
      <H2>Site publisher</H2>
      <P>
        <strong>Global Apex.Net</strong>, a French société par actions simplifiée with a share capital of 100 euros, registered with the Versailles Trade and Companies Register under number 941 666 067, with its registered office at 4 Boulevard du Château, 78280 Guyancourt, France. Intra-community VAT number: FR89 941 666 067. APE code 62.02A. Global Apex.Net publishes and operates the Tenu.World service available at <code>tenu.world</code>.
      </P>
      <P>
        Publisher contact: <code>contact@tenu.world</code> and <code>dpo@tenu.world</code>.
      </P>

      <H2>Publication director</H2>
      <P>
        Malik Mubashir Hassan, President of Global Apex.Net.
      </P>

      <H2>Host</H2>
      <P>
        Vercel Inc., 340 S Lemon Avenue #4133, Walnut, CA 91789, United States. The hosting infrastructure used for European users is located in the CDG (Paris) region. Contact: <code>privacy@vercel.com</code>. Website: <code>https://vercel.com</code>.
      </P>

      <H2>Personal data</H2>
      <P>
        The processing of personal data is described in the privacy policy published at <code>tenu.world/legal/privacy/en</code>. For any question or to exercise your rights: <code>dpo@tenu.world</code>.
      </P>
    </LegalPage>
  );
}
