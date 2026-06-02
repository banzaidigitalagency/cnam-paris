# Dashboard média — CNAM Paris (Inscriptions)

Design validé le 2026-06-02.

## Objectif

Dashboard de suivi multi-plateformes pour le client **CNAM Paris**, campagne « Inscriptions ».
Livrable agence, même qualité que le dashboard Cloche d'Or, adapté à 3 plateformes (Meta,
LinkedIn, DV360/programmatique) et à une logique de test A/B d'ad copies. Mise à jour 24h
automatique, hébergé GitHub → Vercel.

## Sources de données

Aucune des 3 sources Cnam Paris n'était dans l'entrepôt au moment du design ; elles y sont
rattachées (la pipeline existante synchronise déjà Meta + LinkedIn + DV360 pour d'autres Cnam).

| Plateforme | Compte | Détail |
|---|---|---|
| **Meta** | `act_312120810161701` (CNAM FRANCE) | Campagne `120245082260010757` « CNAM PARIS - 2606 - INSCRIPTIONS », objectif LEADS (OFFSITE_CONVERSIONS = clic « s'inscrire »). 2 ad sets à budget égal = 2 ad copies : « LES INSCRIPTIONS SONT OUVERTES » et « ET SI C'ÉTAIT LE MOMENT ». Démarrée le 2026-06-02. |
| **LinkedIn** | `502420306` (CNAM FRANCE) | Campagne visite site + tracking conversion. 4 ad sets = 2 formats (image/vidéo) × 2 ad copies. Ajouté à l'entrepôt par l'équipe. |
| **DV360** | advertiser `971169501` (SMART - CNAM FRANCE), partner `6163736` | Programmatique, 3 lignes : IAB/Interstitiel · Outstream · YouTube. |

## Architecture

Identique au modèle Cloche d'Or (éprouvé) :

```
Entrepôt Supabase DASHBOARD MATTHIEU (mfqbhpxsuawujnfbcojr)
  campaigns / ad_groups / ads / *_insights  (sync 24h existante)
   └─ RPC cnam_dashboard_payload(start,end)  [SECURITY DEFINER, filtré sur les 3 comptes Cnam Paris]
        └─ Edge Function publique cnam-dashboard-api  [service_role, aucune clé DB dans le navigateur]
             └─ React/Vite → GitHub (banzaidigitalagency/cnam-paris) → Vercel
```

- Granularité quotidienne, agrégation de n'importe quelle plage côté RPC.
- Mapping entrepôt : `ad_groups` = ad sets (Meta) / ad sets (LinkedIn) / line items (DV360). `ads` = créas.
- Ad copy : porté par le **nom de l'ad set** (Meta : « AD COPY "…" » ; LinkedIn : format + copy dans le nom).
- Conversions : champs `conversions` / `all_conversions` des tables `*_insights`.
- Montants `spend` en euros, `ctr` en %. (À reconfirmer par plateforme à l'implémentation, cf. le piège
  taux d'impression fraction vs % rencontré sur Cloche d'Or.)
- Tant qu'un compte n'est pas synchronisé, sa section affiche « campagne en démarrage » (la campagne
  a démarré le jour du design → données quasi nulles au début, comportement attendu).

## Décisions figées

- **Conversions visibles partout** (Meta + LinkedIn). Prog = impressions/clics/CTR uniquement.
- **A/B « Quel message gagne ? » à la fin de chaque plateforme** concernée (Meta, LinkedIn) — pas de
  section unique. DV360 : pas d'A/B (pas d'ad copy).
- **Typo : tout-Archivo** (display + chiffres, grotesque contemporain, graisse 600-700, tracking serré)
  + **Inter Tight** (corps). Moderne et élégant, dans l'esprit « le cnam » sans excentricité.
- **Accent rouge Cnam `#E2001A`** + noir, sur **thème clair** (fond crème/blanc). Logo « le cnam » en tuile rouge.
- Hébergement : repo privé `banzaidigitalagency/cnam-paris` → Vercel (auto-deploy sur push).

## Structure du dashboard

- **Top bar** : logo le cnam, « Reporting média · CNAM Paris — Inscriptions », sélecteur de dates
  (presets 7j / 30j / depuis lancement + plage custom), export PDF.
- **Hero** : titre sobre, « mis à jour il y a Xh », budget média total (3 plateformes), période.
- **KPIs globaux agrégés** : Impressions · Clics · CTR · Conversions (inscriptions) · Coût · CPA.
  Sparklines + deltas vs période précédente.
- **/01 Meta** : KPIs (impr, clics, CTR, conversions, CPA) + top créas + bloc **A/B « Quel message
  gagne ? »** comparant les 2 ad copies (gagnant mis en avant par CTR + CPA).
- **/02 LinkedIn** : KPIs + détail **par format (image/vidéo)** + top créas + bloc **A/B** (2 ad copies).
  Conversions affichées.
- **/03 Programmatique (DV360)** : 3 lignes IAB/Interstitiel · Outstream · YouTube, stats simples
  (impressions, clics, CTR) par ligne.
- **Lecture rapide** : insights positifs par règles (pas de LLM).
- **Footer** : généré le … · source entrepôt média · préparé par l'agence.

## Sécurité

Même modèle que Cloche d'Or : aucune clé DB dans le navigateur (Edge Function service_role).
Rappel : 6 tables de l'entrepôt sont sans RLS (`crm_leads`, `billing_coefficients`…) — à faire
activer par l'équipe avant exposition publique.

## Hors périmètre (YAGNI)

- Pas de pipeline de refresh dédié (la sync existante gère les 3 plateformes).
- Pas d'A/B sur la prog (pas d'ad copy).
- Pas d'auth du dashboard (URL Vercel publique en lecture seule).
