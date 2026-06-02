# Dashboard CNAM Paris — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a light-themed, multi-platform media dashboard for CNAM Paris (Meta + LinkedIn + DV360), fed by the Supabase warehouse, with per-platform A/B ad-copy comparison, deployed via GitHub → Vercel.

**Architecture:** A single Postgres RPC `cnam_dashboard_payload(start,end)` (SECURITY DEFINER, service_role only) reads the existing warehouse tables filtered to the 3 CNAM Paris accounts and returns a per-platform JSON payload (global aggregate, Meta, LinkedIn, DV360, plus ad-copy/format/creative breakdowns). A public Edge Function `cnam-dashboard-api` exposes it (no DB key in the browser). A React/Vite SPA renders it. Existing 24h sync keeps data fresh.

**Tech Stack:** Supabase (Postgres 17, Edge Functions/Deno), React 18 + Vite, Recharts, Archivo + Inter Tight (Google Fonts), Vercel.

**Key identifiers:**
- Supabase project: `mfqbhpxsuawujnfbcojr` (DASHBOARD MATTHIEU)
- Meta: account `act_312120810161701`, campaign `120245082260010757` (CNAM PARIS - 2606 - INSCRIPTIONS), 2 ad sets = 2 ad copies, OFFSITE_CONVERSIONS
- LinkedIn: account `502420306` (4 ad sets = 2 formats × 2 copies) — being added to warehouse
- DV360: advertiser `971169501` (SMART - CNAM FRANCE), partner `6163736`, 3 lines (IAB/Interstitiel, Outstream, YouTube)
- Repo: `banzaidigitalagency/cnam-paris` (cloned at /Users/jeremy/Desktop/cnam-paris)
- Brand: red `#E2001A`, light theme, Archivo display + Inter Tight body

---

## Phase 0 — Verify warehouse reality

### Task 0: Confirm which CNAM Paris accounts are in the warehouse + their schema/units

**Step 1:** `execute_sql` — find the 3 accounts:
```sql
select platform, platform_account_id, name, id from ad_accounts
where platform_account_id in ('act_312120810161701','502420306','971169501');
```
**Step 2:** For each present account, sample insights to confirm: presence of `conversions`/`all_conversions`, `spend` unit (€), `ctr` scale (% vs fraction), and how ad-set / line names encode ad copy + format. Query `campaigns`, `ad_groups`, `ads`, `*_insights` joined to each account.
**Step 3:** Record findings in a comment block at the top of the migration file. If an account is absent, the RPC must still work (return empty platform block) — note which are missing and flag to the user (colleague is adding LinkedIn).

---

## Phase 1 — Aggregation RPC

### Task 1: Create `cnam_dashboard_payload(p_start date, p_end date)`

**Tool:** `apply_migration` (name: `cnam_dashboard_payload_fn`). Save SQL to `supabase/migrations/0001_cnam_dashboard_payload.sql`.

**Behavior — returns one JSON object:**
```
{
  meta_info: { last_sync, min_date, max_date },
  global:   { current:{impr,clk,spend,conv}, previous:{...}, daily:[{date,impr,clk,spend,conv,ctr}] },
  meta:     { current, previous, daily, adCopies:[{copy,impr,clk,ctr,spend,conv,cpa}], creatives:[...] },
  linkedin: { current, previous, daily, adCopies:[...], formats:[{format,impr,clk,ctr,conv}], creatives:[...] },
  dv360:    { current, previous, daily, lines:[{line,impr,clk,ctr}] }
}
```
**Rules:**
- Resolve the 3 account UUIDs by `platform_account_id`. Any missing → that platform block is `null` / empty arrays (frontend shows "en démarrage").
- Aggregate helpers: CTR = clicks/impr*100, CPA = spend/conversions, weighted where needed.
- `global` = sum across the present platforms (impr, clk, spend, conv).
- Meta ad copy = `ad_groups.name` (the ad set name). LinkedIn ad copy + format parsed from `ad_groups.name` (confirm pattern in Task 0; fall back to full name if unparseable).
- DV360 lines = `ad_groups` (line items) grouped by name; map to the 3 expected line labels by keyword match (IAB/interstitiel, outstream, youtube), else raw name.
- `previous` = same-length window immediately before `p_start` (for deltas).
- `EXECUTE` granted to `service_role` only; `revoke` from public/anon/authenticated.

**Step 1:** Write + apply migration.
**Step 2:** `execute_sql` test: `select jsonb_pretty(cnam_dashboard_payload('2026-06-01','2026-06-30'));` — verify shape and that present platforms return numbers.
**Step 3:** Commit the migration file.

---

## Phase 2 — Edge Function

### Task 2: Deploy `cnam-dashboard-api`

**Files:** Create `supabase/functions/cnam-dashboard-api/index.ts` (copy the Cloche d'Or pattern: CORS, `start`/`end` query params with YYYY-MM-DD validation, default range last ~90d, service-role client, call RPC, cache 300s). Deploy with `deploy_edge_function`, `verify_jwt: false`.

**Step 1:** Deploy. **Step 2:** `curl` the endpoint with `?start=2026-06-01&end=2026-06-30`, verify JSON. **Step 3:** Commit.

---

## Phase 3 — Frontend scaffold + theme

### Task 3: Scaffold Vite React in the repo

**Step 1:** In `/Users/jeremy/Desktop/cnam-paris`: create `package.json` (react, react-dom, recharts; vite + @vitejs/plugin-react), `vite.config.js`, `index.html` (Archivo + Inter Tight Google Fonts link), `.env.local` with `VITE_API_URL=https://mfqbhpxsuawujnfbcojr.supabase.co/functions/v1/cnam-dashboard-api`, `.env.example`.
**Step 2:** `npm install` then `npm run build` to confirm toolchain.
**Step 3:** Commit.

### Task 4: Theme tokens + lib

**Files:** `src/styles.css` (light theme, `--brand-red:#E2001A`, `--brand-red-deep:#b30015`, cream bg `#faf7f4`, white cards, ink `#16110a`; Archivo for display classes via `font-variation-settings`/weight, Inter Tight body), `src/lib/format.js` (fmtInt, fmtNum, fmtEUR, fmtPct, derive, pctDelta, relativeFromNow — reuse Cloche d'Or), `src/lib/api.js` (fetch wrapper), `src/main.jsx`.
**Step 1–3:** Create, build, commit.

### Task 5: Logo asset

**Step 1:** Save the "le cnam" logo to `src/assets/logo.png` (red tile). If only the chat image is available, recreate a clean red tile with "le **cnam**" in Archivo as an SVG component `src/components/Logo.jsx` (white text on `--brand-red`). Prefer a real asset if the user provides one.
**Step 2:** Commit.

---

## Phase 4 — Dashboard UI

### Task 6: TopBar + DateRangePicker + Hero
Reuse Cloche d'Or components, swap branding/colors. Hero: title (sober, e.g. "Performance / des campagnes."), "mis à jour il y a Xh", total média budget, période. Build + commit.

### Task 7: Global KPI row + Sparkline
KPIs: Impressions · Clics · CTR · Conversions (inscriptions) · Coût · CPA. Sparklines from `global.daily`. Deltas vs previous (show "réf." when no previous). Build + commit.

### Task 8: PlatformSection + Meta section (with A/B block)
**Files:** `src/components/PlatformSection.jsx` (header /0N + title + sub), `src/components/AbTest.jsx` (the "Quel message gagne ?" block: 2 ad copies side by side, winner highlighted by CTR + CPA), `src/components/Creatives.jsx` (top créas table).
Meta section: KPIs (impr, clics, CTR, conversions, CPA) + Creatives + AbTest(meta.adCopies). Empty state "campagne en démarrage" when block null. Build + commit.

### Task 9: LinkedIn section
KPIs + format breakdown (image/vidéo) + Creatives + AbTest(linkedin.adCopies). Conversions shown. Build + commit.

### Task 10: Programmatique (DV360) section
3 lines (IAB/Interstitiel, Outstream, YouTube) as a simple table: impressions, clics, CTR per line. No A/B. Empty state if absent. Build + commit.

### Task 11: QuickRead (positive insights) + Footer + assemble App
`src/lib/insights.js` (positive-only rules across platforms: best ad copy, strong CTR, conversions trend, best prog line). `src/components/QuickRead.jsx`, `src/components/Footer.jsx`. Assemble `src/App.jsx` (date state, fetch, loading/empty/error states, sections in order: Global → /01 Meta → /02 LinkedIn → /03 Programmatique → Lecture rapide → Footer). Print CSS. Build + commit.

---

## Phase 5 — Verify + ship

### Task 12: Browser verification
Use Claude_Preview: launch dev server, screenshot desktop + mobile, check console errors, verify date presets re-query, verify A/B winner highlighting and empty states. Fix issues. Commit.

### Task 13: Push + Vercel
**Step 1:** Push to `origin main`. **Step 2:** Guide the user: Vercel → Import `cnam-paris` → framework Vite → env var `VITE_API_URL` → Deploy. **Step 3:** Confirm deployed URL renders.

---

## Notes / risks
- **Data may be near-empty** (campaign launched 2026-06-02). Every section must degrade gracefully to "campagne en démarrage". This is expected, not a bug.
- **LinkedIn not yet in warehouse** at plan time — colleague adding it. Build so it lights up automatically once synced.
- **Unit consistency** (spend €, ctr %, impression-share fraction-vs-percent) — confirm per platform in Task 0; normalize in the RPC so the whole payload is consistent (lesson from Cloche d'Or).
- **Conversions visible everywhere** per client decision (Meta + LinkedIn). Prog = impr/clics/CTR only.
- Security: 6 warehouse tables lack RLS — flag to user before public exposure (don't auto-fix).
