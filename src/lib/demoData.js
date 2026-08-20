// Fixture de démo réaliste pour la revue visuelle (entrepôt encore vide en prod).
// Activée via VITE_DEMO=1 ou ?demo=1.
import { toISODate, parseISO } from './format.js'
import { ctr, sumRows } from './derive.js'

// Construit un tableau quotidien zéro-rempli sur la plage, avec une montée
// en charge à partir d'une date de lancement, répartie selon des poids.
function buildDaily(range, totals, { launchOffset = 0 } = {}) {
  const days = range.dates
  // Poids croissants (ramp-up) sur les jours après le lancement.
  const weights = days.map((_, i) => {
    if (i < launchOffset) return 0
    const k = i - launchOffset
    return 1 + k * 0.18
  })
  const wSum = weights.reduce((a, b) => a + b, 0) || 1

  return days.map((date, i) => {
    const w = weights[i] / wSum
    const imp = Math.round(totals.imp * w)
    const clk = Math.round(totals.clk * w)
    const spend = Math.round(totals.spend * w * 100) / 100
    const conv = w === 0 ? 0 : Math.round(totals.conv * w)
    return { date, imp, clk, spend, conv, ctr: ctr(imp, clk) ?? 0 }
  })
}

function dateRange(start, end) {
  const s = parseISO(start) || new Date()
  const e = parseISO(end) || new Date()
  const dates = []
  const cur = new Date(s)
  // Plafonner à ~120 jours par sécurité.
  let guard = 0
  while (cur <= e && guard < 200) {
    dates.push(toISODate(cur))
    cur.setDate(cur.getDate() + 1)
    guard++
  }
  if (dates.length === 0) dates.push(toISODate(s))
  return { dates }
}

function withPrevious(current) {
  // previous ~ 80% du current pour des deltas non nuls et réalistes.
  return {
    imp: Math.round(current.imp * 0.8),
    clk: Math.round(current.clk * 0.8),
    spend: Math.round(current.spend * 0.8 * 100) / 100,
    conv: Math.round(current.conv * 0.8),
  }
}

export function demoData({ start, end, wave = 'rentree' }) {
  // La vague juin a 3 lignes prog (avec Outstream) ; la rentrée en a 2.
  const isJuin = wave === 'juin'
  // Plage par défaut : ~14 jours si non fournie.
  let s = start
  let e = end
  if (!s || !e) {
    const today = new Date()
    const from = new Date(today)
    from.setDate(from.getDate() - 13)
    s = toISODate(from)
    e = toISODate(today)
  }
  const range = dateRange(s, e)
  const launchOffset = Math.max(0, Math.floor(range.dates.length * 0.15))

  // ---------- META ----------
  const metaAdSets = [
    {
      name: 'AD COPY "ET SI C\'ÉTAIT LE MOMENT"',
      imp: 5400,
      clk: 210,
      spend: 92.4,
      conv: 18,
      ctr: 3.89,
    },
    {
      name: 'AD COPY "LES INSCRIPTIONS SONT OUVERTES"',
      imp: 2690,
      clk: 100,
      spend: 47.5,
      conv: 7,
      ctr: 3.72,
    },
  ]
  const metaCreatives = [
    { name: 'Visuel — Campus de jour', imp: 3120, clk: 128, spend: 54.2, conv: 11 },
    { name: 'Visuel — Témoignage alternant', imp: 2280, clk: 92, spend: 39.8, conv: 8 },
    { name: 'Carrousel — 3 parcours phares', imp: 1480, clk: 54, spend: 25.1, conv: 4 },
    { name: 'Visuel — Et si c\'était le moment', imp: 1210, clk: 36, spend: 20.8, conv: 2 },
  ].map((c) => ({ ...c, ctr: ctr(c.imp, c.clk) ?? 0 }))
  const metaCurrent = sumRows(metaAdSets)
  const meta = {
    current: metaCurrent,
    previous: withPrevious(metaCurrent),
    daily: buildDaily(range, metaCurrent, { launchOffset }),
    adSets: metaAdSets,
    creatives: metaCreatives,
  }

  // ---------- LINKEDIN ----------
  const liAdSets = [
    {
      name: 'Image — "ET SI C\'ÉTAIT LE MOMENT"',
      imp: 18400,
      clk: 92,
      spend: 286.0,
      conv: 5,
    },
    {
      name: 'Vidéo — "ET SI C\'ÉTAIT LE MOMENT"',
      imp: 21300,
      clk: 138,
      spend: 358.5,
      conv: 7,
    },
    {
      name: 'Image — "LES INSCRIPTIONS SONT OUVERTES"',
      imp: 12600,
      clk: 58,
      spend: 201.4,
      conv: 3,
    },
    {
      name: 'Vidéo — "LES INSCRIPTIONS SONT OUVERTES"',
      imp: 15100,
      clk: 84,
      spend: 254.8,
      conv: 4,
    },
  ].map((a) => ({ ...a, ctr: ctr(a.imp, a.clk) ?? 0 }))
  const liCreatives = [
    { name: 'Vidéo — Portrait étudiant (30s)', imp: 19800, clk: 121, spend: 332.1, conv: 6 },
    { name: 'Image — Chiffres clés du diplôme', imp: 14200, clk: 71, spend: 228.4, conv: 4 },
    { name: 'Vidéo — Visite du campus', imp: 12600, clk: 79, spend: 211.0, conv: 4 },
    { name: 'Image — Inscriptions ouvertes', imp: 10300, clk: 49, spend: 168.2, conv: 2 },
    { name: 'Carrousel — Débouchés métiers', imp: 7400, clk: 32, spend: 120.6, conv: 1 },
  ].map((c) => ({ ...c, ctr: ctr(c.imp, c.clk) ?? 0 }))
  const liCurrent = sumRows(liAdSets)
  const linkedin = {
    current: liCurrent,
    previous: withPrevious(liCurrent),
    daily: buildDaily(range, liCurrent, { launchOffset }),
    adSets: liAdSets,
    creatives: liCreatives,
  }

  // ---------- DV360 ----------
  const dvAdSets = (isJuin
    ? [
        { name: 'LI — IAB Interstitiel Display', imp: 84200, clk: 168, spend: 412.0, conv: 0 },
        { name: 'LI — Outstream Vidéo', imp: 61500, clk: 92, spend: 338.5, conv: 0 },
        { name: 'LI — YouTube Bumper', imp: 47800, clk: 61, spend: 286.2, conv: 0 },
      ]
    : [
        { name: 'IAB / INTERSTITIEL', imp: 84200, clk: 168, spend: 412.0, conv: 0 },
        { name: 'YOUTUBE', imp: 47800, clk: 61, spend: 286.2, conv: 0 },
      ]
  ).map((a) => ({ ...a, ctr: ctr(a.imp, a.clk) ?? 0 }))
  const dvCreatives = (isJuin
    ? [
        { name: 'Display 300x250 — Et si c\'était le moment', imp: 52100, clk: 104, spend: 251.3, conv: 0 },
        { name: 'Outstream 16:9 — Campus', imp: 41200, clk: 61, spend: 226.8, conv: 0 },
        { name: 'YouTube Bumper 6s — Inscriptions', imp: 33600, clk: 44, spend: 198.4, conv: 0 },
      ]
    : [
        { name: 'Display 300x250 — Et si c\'était le moment', imp: 52100, clk: 104, spend: 251.3, conv: 0 },
        { name: 'YouTube Bumper 6s — Inscriptions', imp: 33600, clk: 44, spend: 198.4, conv: 0 },
      ]
  ).map((c) => ({ ...c, ctr: ctr(c.imp, c.clk) ?? 0 }))
  const dvCurrent = sumRows(dvAdSets)
  const dv360 = {
    current: dvCurrent,
    previous: withPrevious(dvCurrent),
    daily: buildDaily(range, dvCurrent, { launchOffset }),
    adSets: dvAdSets,
    creatives: dvCreatives,
  }

  // ---------- GLOBAL = somme des 3 plateformes ----------
  const globalCurrent = sumRows([metaCurrent, liCurrent, dvCurrent])
  const globalDaily = range.dates.map((date, i) => {
    const m = meta.daily[i]
    const l = linkedin.daily[i]
    const d = dv360.daily[i]
    const imp = m.imp + l.imp + d.imp
    const clk = m.clk + l.clk + d.clk
    const spend = Math.round((m.spend + l.spend + d.spend) * 100) / 100
    const conv = m.conv + l.conv + d.conv
    return { date, imp, clk, spend, conv, ctr: ctr(imp, clk) ?? 0 }
  })
  const global = {
    current: globalCurrent,
    previous: withPrevious(globalCurrent),
    daily: globalDaily,
    adSets: [],
    creatives: [],
  }

  const lastSync = new Date()
  lastSync.setHours(lastSync.getHours() - 3)

  return {
    meta_info: {
      wave: isJuin ? 'juin' : 'rentree',
      min_date: range.dates[0],
      max_date: range.dates[range.dates.length - 1],
      last_sync: lastSync.toISOString(),
      platforms_present: { meta: true, linkedin: true, dv360: true },
    },
    global,
    meta,
    linkedin,
    dv360,
  }
}
