# Politique de confidentialité — Tenu.World

**Version:** v1.0-draft
**Dernière mise à jour:** 2026-04-17
**Statut:** DRAFT en attente de validation par Dr Mubashir et revue avocat

---

## 1. Qui traite vos données

Le responsable du traitement est **Global Apex.Net**, société par actions simplifiée au capital de [CAPITAL EUR] euros, immatriculée au Registre du commerce et des sociétés de Versailles sous le numéro 941 666 067, dont le siège social est situé 4 Boulevard du Château, 78280 Guyancourt, France. Numéro de TVA intracommunautaire : FR89 941 666 067. Code APE 62.02A. Global Apex.Net édite et exploite le service Tenu.World accessible depuis le domaine `tenu.world`.

Pour toute question relative à vos données, vous pouvez écrire à notre point de contact RGPD à l'adresse `dpo@tenu.world`. Nous répondons dans un délai maximum d'un mois.

Global Apex.Net n'est pas soumise à l'obligation de désignation d'un délégué à la protection des données au sens de l'article 37 du RGPD. L'adresse `dpo@tenu.world` constitue un point de contact unique pour toute question relative à la protection des données.

## 2. Quelles données nous collectons

Nous traitons trois catégories de données.

**Données de compte.** Adresse électronique, préférence de langue, date d'inscription. Collectées lorsque vous créez un compte via un lien magique.

**Données d'inspection.** Adresse du logement loué, juridiction applicable (France ou Royaume-Uni), nom du bailleur si vous le saisissez, photographies pièce par pièce, observations textuelles libres que vous ajoutez.

**Données de paiement.** Nom, adresse de facturation, montant versé, horodatage de la transaction. Le numéro de carte n'est jamais collecté ni stocké par Tenu.World : il est traité directement par Stripe.

Nous ne collectons aucune donnée dite sensible au sens de l'article 9 du RGPD.

## 3. Sur quelle base juridique

Nous nous appuyons sur deux bases juridiques distinctes selon la finalité.

**Consentement (article 6.1.a du RGPD)** pour le traitement des photographies et des observations que vous nous confiez. Le consentement est demandé explicitement avant tout téléversement. Vous pouvez le retirer à tout moment, ce qui entraîne la suppression des photographies concernées.

**Exécution d'un contrat (article 6.1.b du RGPD)** pour la génération du rapport d'analyse de dépôt de garantie, la génération de la lettre type en cas de litige, l'émission de la facture et le paiement par carte bancaire.

## 4. Combien de temps nous conservons vos données

| Catégorie | Durée de conservation | Motif |
|---|---|---|
| Données de compte | Tant que le compte reste actif, puis 12 mois après clôture | Contentieux possible sur la prestation |
| Photographies et observations d'inspection | 24 mois à compter de la date d'inspection | Durée typique d'un litige locatif en France |
| Rapports et lettres générés (PDF) | 24 mois | Archivage pour preuve |
| Facturation | 10 ans | Obligation comptable, article L123-22 Code de commerce |
| Journaux techniques anonymisés | 6 mois | Sécurité et détection de fraude |

Au-delà de ces durées, les données sont supprimées automatiquement par notre système de purge. Vous pouvez demander la suppression anticipée à tout moment (voir section 7).

## 5. Où vos données sont hébergées

Toutes les données sont hébergées au sein de l'Union européenne ou du Royaume-Uni. Aucun transfert hors de cet espace n'a lieu dans le cadre normal du service.

- Base de données et authentification : Supabase, région Europe (Francfort, Allemagne).
- Photographies et rapports PDF : Cloudflare R2, région EU.
- Plateforme d'hébergement web : Vercel, région CDG (Paris).
- Envoi d'emails transactionnels : Brevo (anciennement Sendinblue), France.
- Paiement : Stripe, traitement conforme à la norme PCI-DSS, entité européenne Stripe Technology Europe Ltd., Dublin.
- Analyse IA : Anthropic via API, traitement dans les régions EU de l'infrastructure Anthropic.

`[À VÉRIFIER PAR AVOCAT: confirmer la région de traitement d'Anthropic au moment de la signature du DPA, l'entreprise revendique un traitement EU sans transfert mais cela doit être audité]`

## 6. Sous-traitants

Les entreprises suivantes traitent vos données en notre nom, au titre d'un contrat de sous-traitance conforme à l'article 28 du RGPD.

| Sous-traitant | Finalité | Siège | Type |
|---|---|---|---|
| Supabase Inc. | Base de données et authentification | Delaware, USA (infra EU Francfort) | DPA signé |
| Cloudflare Inc. | Stockage des photographies et PDF | San Francisco, USA (infra EU) | DPA signé |
| Stripe Technology Europe Ltd. | Paiement | Dublin, Irlande | DPA signé |
| Anthropic PBC | Analyse IA | San Francisco, USA (infra EU) | DPA signé |
| Brevo SA | Envoi d'emails | Paris, France | DPA signé |
| Vercel Inc. | Hébergement web | San Francisco, USA (infra EU) | DPA signé |

Les DPA sont disponibles sur demande à `dpo@tenu.world`.

## 7. Vos droits

Conformément au RGPD et à la loi Informatique et Libertés modifiée, vous disposez des droits suivants, que vous pouvez exercer en écrivant à `dpo@tenu.world` depuis l'adresse email associée à votre compte.

- **Droit d'accès** à vos données.
- **Droit de rectification** en cas d'erreur.
- **Droit à l'effacement** (droit à l'oubli), sous réserve des obligations légales de conservation (notamment la facturation).
- **Droit à la portabilité** : vous pouvez recevoir vos données dans un format structuré lisible par machine.
- **Droit d'opposition** au traitement.
- **Droit de retirer votre consentement** à tout moment pour les traitements fondés sur le consentement.
- **Droit de définir des directives post-mortem** pour le sort de vos données après votre décès (article 85 loi Informatique et Libertés).

Nous vous répondons dans un délai d'un mois, éventuellement prolongé de deux mois en cas de complexité ou de multiplicité des demandes.

Si nous ne vous répondons pas, ou si notre réponse ne vous satisfait pas, vous pouvez adresser une réclamation à la Commission Nationale de l'Informatique et des Libertés (CNIL), 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, `cnil.fr`. Les utilisateurs britanniques peuvent saisir l'Information Commissioner's Office (ICO), `ico.org.uk`.

## 8. Cookies

Nous utilisons uniquement les cookies strictement nécessaires au fonctionnement du service : cookie de session, préférence de langue, jeton d'authentification. Aucun cookie de mesure d'audience tiers n'est déposé sans consentement préalable. Tenu.World ne pratique pas la publicité comportementale.

Un outil de gestion du consentement est affiché à la première visite pour recueillir votre avis sur l'éventuel ajout futur de cookies non essentiels. Tant que le consentement n'est pas donné, aucun cookie non essentiel n'est déposé.

## 9. Sécurité

Les photographies et les rapports sont accessibles uniquement via des URL signées à durée limitée (maximum sept jours). L'authentification utilise un lien magique sans mot de passe. Les communications sont chiffrées en transit (TLS 1.3). Les données au repos sont chiffrées côté hébergeur.

Nous tenons un registre des traitements et un registre des incidents. Toute violation de données entraîne une notification à la CNIL dans les 72 heures conformément à l'article 33 du RGPD, et une information directe des personnes concernées si le risque est élevé.

## 10. Mineurs

Le service Tenu.World s'adresse à des adultes. Nous n'autorisons pas la création de compte par une personne de moins de dix-huit ans. Si nous découvrons qu'un compte a été ouvert par un mineur, nous le supprimons.

## 11. Modification de la présente politique

Nous pouvons modifier cette politique pour refléter une évolution légale ou technique. Toute modification substantielle fait l'objet d'une notification par email au minimum trente jours avant son entrée en vigueur. La version la plus récente est toujours consultable sur `tenu.world/fr/confidentialite`.

## 12. Droit applicable

Le droit applicable est le droit français. Tout litige relatif au traitement de vos données relève de la compétence des tribunaux français, sans préjudice de votre droit de saisir votre juridiction de résidence habituelle au sein de l'Union européenne.

---

## Journal des versions

| Version | Date | Modification |
|---|---|---|
| v1.0-draft | 2026-04-17 | Version initiale, en attente de revue avocat |
