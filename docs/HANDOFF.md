# CNAM Paris — Handoff / reprise de session

État à jour du dashboard média CNAM Paris, pour reprendre vite dans une nouvelle
session Claude Code. Ouvre la session **dans ce repo** (`cd ~/Desktop/cnam-paris`)
pour avoir tout sous la main (code, migrations, docs). Le skill **agency-dashboard**
(installé en global) se déclenchera et apporte l'archi + les pièges génériques.

## En une phrase (1er message conseillé de la nouvelle session)

> « On met à jour le dashboard CNAM Paris. Lis `docs/HANDOFF.md` et `docs/plans/`. Ce
> que je veux changer : … »

## Ce que c'est

Dashboard média multi-plateformes (Meta + LinkedIn + DV360/programmatique) pour la
campagne **« CNAM PARIS - 2606 - INSCRIPTIONS »**. Livrable agence, en ligne sur
Vercel, mise à jour ~quotidienne via la synchro de l'entrepôt existante.

## Architecture (identique au modèle Cloche d'Or)

```
Entrepôt Supabase DASHBOARD MATTHIEU (ref mfqbhpxsuawujnfbcojr)
  → RPC cnam_dashboard_payload(start,end)  [SECURITY DEFINER, service_role]
      (+ helper cnam_block(uuid[], start, end) — scopé aux campagnes de la vague 2606)
  → Edge Function publique cnam-dashboard-api  [verify_jwt=false, service_role côté serveur]
  → React/Vite (VITE_API_URL) → GitHub banzaidigitalagency/cnam-paris → Vercel (auto-deploy)
```

- Le front ne lit **jamais** la base directement (clé service_role côté Edge Function only).
- Mode démo pour QA visuelle sans données : `?demo=1` (fixture `src/lib/demoData.js`).
- **Vercel env var** : `VITE_API_URL=https://mfqbhpxsuawujnfbcojr.supabase.co/functions/v1/cnam-dashboard-api` (ne PAS mettre `VITE_DEMO` en prod).

## Identifiants clés

| Élément | Valeur |
|---|---|
| Supabase project ref | `mfqbhpxsuawujnfbcojr` |
| RPC | `cnam_dashboard_payload(date,date)` + `cnam_block(uuid[],date,date)` |
| Edge Function | `cnam-dashboard-api` |
| **Meta** | compte `act_312120810161701` · campagne `120245082260010757` (2606 INSCRIPTIONS) |
| **LinkedIn** | compte `502420306` · campagne `1116100353` |
| **DV360** | advertiser `971169501` (partner `6163736`) · campagne `56983506` (CNAM - 2606 - VAGUE INSCRIPTIONS) |

Le RPC **scope sur ces 3 campagnes** (par `platform_campaign_id` → UUID), pas sur les
comptes entiers (les comptes ont 40+ campagnes historiques). Pour une nouvelle vague,
il faut mettre à jour ces IDs dans le RPC (migration Supabase).

## Décisions produit déjà prises (à respecter)

- **Charte = personnalisée CNAM** (rouge `#E2001A`, **Archivo** display + Inter Tight,
  fond clair). Logo officiel « le cnam » (`src/assets/cnam-logo.jpeg`). *Pas* la charte
  SMART. (Le skill demande SMART vs client — ici c'est client.)
- **Pas de budget / coût / CPA** affiché.
- **Conversion = clic sur le bouton « S'inscrire »** (pas l'inscription finale, non
  trackable) → libellé **« Clics "S'inscrire" »** partout, jamais « inscriptions générées ».
- **Lecture rapide = ad copies uniquement** (message gagnant global + Meta + LinkedIn).
  Pas de tendances/déroulement. Regroupement des ad copies **insensible aux accents/casse**
  (« ÉTAIT » vs « ETAIT » = 1 seul message) via `normalizeKey` dans `src/lib/derive.js`.
- **Logos de plateforme** dans les en-têtes de section (Meta ∞, LinkedIn in, prog =
  glyphe display) au lieu de `/01 /02` — sauf `/00 Vue d'ensemble` et `/04 Lecture rapide`.
- **A/B « Quel message gagne ? »** après Meta et LinkedIn (2 messages). LinkedIn a aussi
  un breakdown **Image vs Vidéo**.
- **Programmatique** : toujours les **3 lignes** IAB/Interstitiel · Outstream · YouTube
  (à 0 si pas encore diffusée), stats simples impr/clics/CTR.
- Footer : préparé par l'agence (adapter si besoin comme sur Cloche d'Or → « Dashboard
  créé par Agence SMART »).

## Pièges connus (entrepôt)

- Champ `channel` **vide** dans l'entrepôt → on distingue les campagnes par le **nom**.
- `search_impression_share` : **%** au niveau campagne, **fraction (0-1)** au niveau
  keyword → normaliser (×100) — déjà géré.
- Une campagne fraîchement lancée peut être **vide** jusqu'à la prochaine synchro →
  états « en démarrage » gracieux, ce n'est pas un bug.
- Sécurité : 6 tables de l'entrepôt sans RLS (`crm_leads`, `billing_coefficients`…) —
  à faire activer par l'équipe avant toute exposition large de la clé anon (le dashboard
  passe par l'Edge Function service_role, donc pas exposé, mais à garder en tête).

## Comment mettre à jour

- **Données / RPC** : via le MCP Supabase (`apply_migration` sur `mfqbhpxsuawujnfbcojr`).
  Les migrations sont dans `supabase/migrations/`. Toujours re-tester le RPC + l'endpoint
  `cnam-dashboard-api` après changement.
- **Front** : `npm run dev` (ou build). QA avec `?demo=1`. Composants dans `src/components/`,
  logique réutilisable dans `src/lib/` (`format.js`, `derive.js`, `insights.js`, `api.js`).
- **Déploiement** : commit + push sur `main` → Vercel redéploie tout seul.
- MCP dispos : Meta (`act_312120810161701`), DV360 (advertiser `971169501`), Supabase.
  **LinkedIn n'a pas de MCP** → données LinkedIn uniquement via l'entrepôt.

## Docs liées

- `docs/plans/2026-06-02-cnam-paris-design.md` — design validé.
- `docs/plans/2026-06-02-cnam-paris.md` — plan d'implémentation.
