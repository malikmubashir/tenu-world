# Migration IA — Direct Anthropic API → AWS Bedrock EU

**Date** : 2026-05-26
**Décision** : Mubashir / Renaud (AP3R, DPO)
**Pourquoi** : la politique de confidentialité Tenu promet résidence EU des données.
L'API directe `api.anthropic.com` ne garantit pas la résidence EU sur compte pay-as-you-go.
Bedrock Frankfurt (eu-central-1) la garantit contractuellement.

## Statut

| Étape | Statut |
|---|---|
| Code migré (`risk-scan.ts`, `dispute-letter.ts`) | Fait |
| `package.json` ajout `@anthropic-ai/bedrock-sdk` | Fait |
| `.env.local.template` mis à jour | Fait |
| AWS account créé | À FAIRE (MH) |
| Bedrock model access approuvé | À FAIRE (MH) |
| IAM user + access keys | À FAIRE (MH) |
| Vercel env vars mis à jour | À FAIRE (MH) |
| Vercel env var ANTHROPIC_API_KEY supprimé | À FAIRE (MH, après cutover) |
| Smoke tests preview | À FAIRE |
| Déploiement prod | À FAIRE |
| `npm install` après merge | À FAIRE |

## Modèles utilisés

| Usage | Direct (ancien) | Bedrock EU (nouveau) |
|---|---|---|
| risk-scan PRIMARY | `claude-haiku-4-5-20251001` | `eu.anthropic.claude-haiku-4-5-20251001-v1:0` |
| risk-scan FALLBACK | `claude-sonnet-4-6` | `eu.anthropic.claude-sonnet-4-6-v1:0` |
| dispute-letter | `claude-sonnet-4-6` | `eu.anthropic.claude-sonnet-4-6-v1:0` |

Disponibilité confirmée sur Bedrock Frankfurt eu-central-1 au 2026-05-26.
À revérifier avant chaque deploy : la révision du profil d'inférence (`v1:0` →
`v1:1`) peut bouger.

## Garde-fou résidence EU

`src/lib/ai/risk-scan.ts` et `dispute-letter.ts` refusent de booter si
`AWS_REGION` ne commence pas par `eu-`. Belt and suspenders : même si quelqu'un
flippe la variable d'env par erreur, le code lève `INVALID_INPUT` au lieu
d'envoyer la requête.

## Check-list MH (manuelle, hors Cowork)

### 1. Création compte AWS (1-2 h)

- https://aws.amazon.com/ → Créer un compte AWS
- Email pro (mubashirr@gmail.com ou tenu@), carte bancaire CB FR
- Choisir support plan Basic (gratuit) pour démarrer
- Activer MFA sur le root account immédiatement après création

### 2. Sélection région Frankfurt (5 min)

- Console AWS → en haut à droite, sélecteur de région → Europe (Frankfurt)
- Vérifier que l'URL affiche `eu-central-1`

### 3. Demande d'accès aux modèles Bedrock (24-72 h d'approbation)

- Console → service "Bedrock" → menu gauche "Model access"
- Cliquer "Modify model access"
- Cocher : Anthropic Claude Sonnet 4.6, Anthropic Claude Haiku 4.5
- Remplir le formulaire d'usage (cas d'usage = analyse de photos de logement
  pour évaluation de dépôt de garantie + génération de lettres juridiques)
- Soumettre, attendre l'email d'approbation AWS

### 4. Création IAM user (10 min, après approbation)

- Console IAM → Users → Create user
- Nom : `tenu-bedrock-prod`
- Pas d'accès console (programmatic only)
- Attacher la policy ci-dessous (créer une policy custom, ne pas utiliser
  `AmazonBedrockFullAccess` qui est trop large) :

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
    "Resource": [
      "arn:aws:bedrock:eu-central-1::foundation-model/anthropic.claude-haiku-4-5-20251001-v1:0",
      "arn:aws:bedrock:eu-central-1::foundation-model/anthropic.claude-sonnet-4-6-v1:0",
      "arn:aws:bedrock:eu-central-1:*:inference-profile/eu.anthropic.claude-haiku-4-5-20251001-v1:0",
      "arn:aws:bedrock:eu-central-1:*:inference-profile/eu.anthropic.claude-sonnet-4-6-v1:0"
    ]
  }]
}
```

- Générer Access Key + Secret pour cet utilisateur
- Stocker temporairement dans 1Password / KeePass / équivalent

### 5. Vercel env vars (5 min)

- Vercel Dashboard → Tenu project → Settings → Environment Variables
- Ajouter pour Production + Preview + Development :
  - `AWS_REGION` = `eu-central-1`
  - `AWS_ACCESS_KEY_ID` = (la clé créée à l'étape 4)
  - `AWS_SECRET_ACCESS_KEY` = (le secret créé à l'étape 4)
- **NE PAS** supprimer `ANTHROPIC_API_KEY` tout de suite — garder en filet
  jusqu'à validation des smoke tests sur preview

### 6. Merge de la branche

- Localement : `npm install` (récupère `@anthropic-ai/bedrock-sdk`)
- `npm run typecheck && npm run build` → doit passer
- Commit : `feat(ai): migrate Claude calls to AWS Bedrock EU (eu-central-1)`
- Push, ouvrir PR, merger dès que Vercel preview est verte

### 7. Smoke tests preview (15 min)

- Sur la preview URL Vercel, créer une inspection test, ajouter 3 photos
- Lancer un risk-scan, vérifier la sortie + `meta.model` dans le PDF
- Générer une dispute letter, vérifier le rendu
- Surveiller les logs Vercel pour erreurs `INVALID_INPUT` (signe de mauvais
  env vars) ou `UPSTREAM_ERROR` (signe de mauvais IAM)

### 8. Cutover prod + nettoyage (10 min)

- Si preview verte, promote sur prod (ou merge sur main)
- Lancer un risk-scan réel
- Si OK, supprimer `ANTHROPIC_API_KEY` de Vercel (toutes les envs)
- Désactiver / révoquer l'ANTHROPIC_API_KEY sur console.anthropic.com
- Mettre à jour memory + dashboard Tenu

## Coûts attendus

Bedrock list price = Anthropic direct price (à ±5 %). Pas d'impact majeur sur
l'unit economics. Plafond actuel risk-scan = 0,12 €, dispute = 0,50 € : inchangé.

Surveiller via AWS Cost Explorer le premier mois. Mettre une alerte budget
AWS à 50 €/mois pour démarrer (Bedrock + S3 inclus).

## Rollback

Si Bedrock présente un problème (panne régionale, dégradation latence),
rollback rapide :

1. Re-mettre `ANTHROPIC_API_KEY` dans Vercel env vars (déjà connue,
   normalement gardée en backup chez MH)
2. Git revert du commit de migration
3. Redéployer

Le rollback est ouvert tant que `@anthropic-ai/sdk` reste dans
`package.json` — ce qui est le cas (on garde le SDK pour les types). Si
rollback prolongé, restaurer le pricing dict et les model IDs directs.
