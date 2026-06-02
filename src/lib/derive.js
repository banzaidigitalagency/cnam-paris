// Calculs dérivés et parsing des noms d'ad sets / line items.

export function ctr(imp, clk) {
  if (!imp) return null
  return (clk / imp) * 100
}

export function cpc(spend, clk) {
  if (!clk) return null
  return spend / clk
}

export function cpa(spend, conv) {
  if (!conv) return null
  return spend / conv
}

// Vrai si toutes les métriques d'un bloc {imp,clk,spend,conv} sont à zéro/absentes.
export function isAllZero(obj) {
  if (!obj) return true
  return (
    !obj.imp && !obj.clk && !obj.spend && !obj.conv
  )
}

// Agrège une liste de lignes {imp,clk,spend,conv} en un total.
export function sumRows(rows) {
  const total = { imp: 0, clk: 0, spend: 0, conv: 0 }
  for (const r of rows || []) {
    total.imp += r.imp || 0
    total.clk += r.clk || 0
    total.spend += r.spend || 0
    total.conv += r.conv || 0
  }
  return total
}

// Extrait le texte entre guillemets doubles (droits ou typographiques).
export function extractQuoted(name) {
  if (!name) return null
  const m = /[«"“]([^"”»]+)[»"”]/.exec(name)
  return m ? m[1].trim() : null
}

// --- META : libellé d'ad copy = texte entre guillemets, sinon nom complet ---
export function metaAdCopyLabel(name) {
  return extractQuoted(name) || (name || '').trim() || 'Annonce'
}

// Regroupe les adSets Meta par ad copy -> [{label, imp, clk, spend, conv}].
export function metaAdCopies(adSets) {
  const groups = new Map()
  for (const a of adSets || []) {
    const label = metaAdCopyLabel(a.name)
    const g = groups.get(label) || { label, imp: 0, clk: 0, spend: 0, conv: 0 }
    g.imp += a.imp || 0
    g.clk += a.clk || 0
    g.spend += a.spend || 0
    g.conv += a.conv || 0
    groups.set(label, g)
  }
  return [...groups.values()]
}

// --- LINKEDIN : parse format + ad copy depuis le nom de l'ad set ---
export function linkedinFormat(name) {
  return /vid[ée]o|video/i.test(name || '') ? 'Vidéo' : 'Image'
}

export function linkedinAdCopyLabel(name) {
  const quoted = extractQuoted(name)
  if (quoted) return quoted
  // Sinon, retirer le mot de format pour garder un libellé propre.
  const cleaned = (name || '')
    .replace(/vid[ée]o|video|image/gi, '')
    .replace(/[–—-]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return cleaned || (name || '').trim() || 'Annonce'
}

function groupBy(adSets, keyFn) {
  const groups = new Map()
  for (const a of adSets || []) {
    const label = keyFn(a.name)
    const g = groups.get(label) || { label, imp: 0, clk: 0, spend: 0, conv: 0 }
    g.imp += a.imp || 0
    g.clk += a.clk || 0
    g.spend += a.spend || 0
    g.conv += a.conv || 0
    groups.set(label, g)
  }
  return [...groups.values()]
}

export function linkedinByFormat(adSets) {
  return groupBy(adSets, linkedinFormat)
}

export function linkedinByAdCopy(adSets) {
  return groupBy(adSets, linkedinAdCopyLabel)
}

// --- DV360 : mappe chaque line item vers une des 3 lignes ---
export function dv360Line(name) {
  const n = name || ''
  if (/iab|interstitiel/i.test(n)) return 'IAB / Interstitiel'
  if (/outstream/i.test(n)) return 'Outstream'
  if (/youtube|\byt\b/i.test(n)) return 'YouTube'
  return n.trim() || 'Ligne'
}

export function dv360Lines(adSets) {
  const order = ['IAB / Interstitiel', 'Outstream', 'YouTube']
  const groups = new Map()
  // Toujours présenter les 3 lignes canoniques, même à 0 (ex. YouTube pas encore
  // diffusée) — le RPC masque les lignes à 0 impression, on les ré-affiche ici.
  for (const label of order) groups.set(label, { label, imp: 0, clk: 0 })
  for (const a of adSets || []) {
    const label = dv360Line(a.name)
    const g = groups.get(label) || { label, imp: 0, clk: 0 }
    g.imp += a.imp || 0
    g.clk += a.clk || 0
    groups.set(label, g)
  }
  const rows = [...groups.values()]
  // Tri : lignes connues d'abord dans l'ordre canonique, puis le reste.
  rows.sort((x, y) => {
    const ix = order.indexOf(x.label)
    const iy = order.indexOf(y.label)
    if (ix === -1 && iy === -1) return y.imp - x.imp
    if (ix === -1) return 1
    if (iy === -1) return -1
    return ix - iy
  })
  return rows
}

// Désigne le gagnant d'un A/B : plus de conversions, sinon meilleur CTR.
// Si aucune conversion nulle part, départage au CTR.
export function pickWinner(groups) {
  if (!groups || groups.length === 0) return null
  const anyConv = groups.some((g) => (g.conv || 0) > 0)
  const ranked = [...groups].sort((a, b) => {
    if (anyConv && (b.conv || 0) !== (a.conv || 0)) {
      return (b.conv || 0) - (a.conv || 0)
    }
    return (ctr(b.imp, b.clk) || 0) - (ctr(a.imp, a.clk) || 0)
  })
  return ranked[0]?.label ?? null
}
