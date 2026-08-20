# CNAM Paris — Handoff / reprise de session

État à jour du dashboard média CNAM Paris, pour reprendre vite dans une nouvelle
session Claude Code. Ouvre la session **dans ce repo** (`cd ~/Desktop/cnam-paris`)
pour avoir tout sous la main (code, migrations, docs). Le skill **agency-dashboard**
(installé en global) se déclenchera et apporte l'archi + les pièges génériques.

## En une phrase (1er message conseillé de la nouvelle session)

> « On met à jour le dashboard CNAM Paris. Lis `docs/HANDOFF.md` et `docs/plans/`. Ce
> que je veux changer : … »

## Ce que c'est

Dashboard média multi-plateformes (Meta + LinkedIn + programmatique) pour la campagne
CNAM Paris — Inscriptions, en **deux vagues** servies par des onglets :
**« Vague rentrée » (2608, onglet par défaut à l'ouverture)** et « Vague juin » (2606).
Livrable agence, en ligne sur Vercel, mise à jour ~quotidienne via la synchro de
l'entrepôt existante.

## Architecture (identique au modèle Cloche d'Or)

```
Entrepôt Supabase DASHBOARD MATTHIEU (ref mfqbhpxsuawujnfbcojr)
  → RPC cnam_dashboard_payload(start,end,wave)  [SECURITY DEFINER, service_role]
      (wave = 'juin' | 'rentree', défaut 'juin' = rétro-compatible ;
       + helper cnam_block(uuid[], start, end) — scopé aux campagnes de la vague)
  → Edge Function publique cnam-dashboard-api  [verify_jwt=false, service_role côté serveur]
      (query param ?wave=juin|rentree, défaut juin)
  → React/Vite (VITE_API_URL) → GitHub banzaidigitalagency/cnam-paris → Vercel (auto-deploy)
```

- Le front ne lit **jamais** la base directement (clé service_role côté Edge Function only).
- Mode démo pour QA visuelle sans données : `?demo=1` (fixture `src/lib/demoData.js`).
- **Vercel env var** : `VITE_API_URL=https://mfqbhpxsuawujnfbcojr.supabase.co/functions/v1/cnam-dashboard-api` (ne PAS mettre `VITE_DEMO` en prod).

## Identifiants clés

| Élément | Valeur |
|---|---|
| Supabase project ref | `mfqbhpxsuawujnfbcojr` |
| RPC | `cnam_dashboard_payload(date,date,text)` + `cnam_block(uuid[],date,date)` |
| Edge Function | `cnam-dashboard-api` (`?wave=juin\|rentree`) |
| Comptes | Meta `act_312120810161701` · LinkedIn `502420306` · DV360 advertiser `971169501` (partner `6163736`) |

Campagnes par vague (`platform_campaign_id` dans l'entrepôt) :

| Vague | Meta | LinkedIn (groupe de campagnes) | DV360 |
|---|---|---|---|
| **rentree** (2608, 24/08→30/09, YouTube dès le 23/08) | `120247939091800757` | `1174118013` | `57200003` |
| **juin** (2606, 01/06→19/07) | `120245082260010757` | `1116100353` | `56983506` |

Le RPC **scope sur les 3 campagnes de la vague** (par `platform_campaign_id` → UUID),
pas sur les comptes entiers (les comptes ont 40+ campagnes historiques). Pour une
nouvelle vague : ajouter le trio d'IDs dans le RPC (migration Supabase), la vague dans
`src/lib/waves.js`, et autoriser la valeur dans l'Edge Function. Côté entrepôt,
« campagne LinkedIn » = groupe de campagnes LinkedIn (les 4 campagnes LinkedIn
deviennent des `ad_groups`).

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
- **Programmatique** : toujours les **lignes programmées sur la vague** (à 0 si pas
  encore diffusée), stats simples impr/clics/CTR. Vague juin = 3 lignes
  IAB/Interstitiel · Outstream · YouTube ; vague rentrée = **2 lignes**
  IAB/Interstitiel · YouTube (pas d'Outstream). Défini dans `src/lib/waves.js`.
- **Vagues en onglets** (`WaveTabs`) : rentrée **par défaut à l'ouverture**. Changer
  d'onglet remet le preset « Depuis le lancement » de la vague ; les presets 7 j/30 j
  sont plafonnés à la fin de vague (juin est terminée). Lancement rentrée = 23/08
  (1ʳᵉ journée possible, ligne YouTube) même si le gros démarre le 24/08.
- **Vague rentrée : ne pas mentionner DV360** dans l'UI (YouTube y est acheté via
  DV360 mais ça ne doit pas apparaître) → sous-titre prog « Display & Vidéo » ;
  la vague juin garde « DV360 · Display & Vidéo » (livrable déjà validé).
- Une section plateforme dont le bloc est **entièrement à zéro** affiche l'état
  « campagne en démarrage » (cas de la rentrée avant le 24/08).
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
- MCP dispos : Meta (`act_312120810161701`), DV360 (advertiser `971169501`), Supabase,
  et désormais **LinkedIn Ads** (compte `502420306`) — utile pour retrouver les IDs de
  campagnes ; les données du dashboard passent toujours par l'entrepôt.

## Docs liées

- `docs/plans/2026-06-02-cnam-paris-design.md` — design validé.
- `docs/plans/2026-06-02-cnam-paris.md` — plan d'implémentation.
