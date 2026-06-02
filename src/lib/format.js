// Formatage FR des nombres, montants, pourcentages et dates.

const nf0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const nf1 = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
const nf2 = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function fmtInt(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return nf0.format(Math.round(n))
}

export function fmtEur(n, decimals = 2) {
  if (n == null || Number.isNaN(n)) return '—'
  const f = decimals === 0 ? nf0 : nf2
  return `${f.format(n)} €`
}

export function fmtPct(n, decimals = 2) {
  if (n == null || Number.isNaN(n)) return '—'
  const f = decimals === 1 ? nf1 : nf2
  return `${f.format(n)} %`
}

// Variation relative entre current et previous, en %. Renvoie null si previous = 0.
export function pctChange(current, previous) {
  if (previous == null || previous === 0) return null
  return ((current - previous) / previous) * 100
}

export function fmtDelta(pct) {
  if (pct == null) return 'réf.'
  const sign = pct > 0 ? '+' : ''
  return `${sign}${nf1.format(pct)} %`
}

// Date ISO (YYYY-MM-DD) -> "12 mai 2026"
export function fmtDateFR(iso) {
  if (!iso) return '—'
  const d = parseISO(iso)
  if (!d) return '—'
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Date ISO courte -> "12 mai"
export function fmtDateShortFR(iso) {
  if (!iso) return '—'
  const d = parseISO(iso)
  if (!d) return '—'
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function parseISO(iso) {
  if (!iso) return null
  // Accepte 'YYYY-MM-DD' comme date locale, ou un timestamp complet.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

export function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Nombre d'heures écoulées depuis un timestamp ISO.
export function hoursSince(iso) {
  if (!iso) return null
  const d = parseISO(iso)
  if (!d) return null
  const diffMs = Date.now() - d.getTime()
  if (diffMs < 0) return 0
  return Math.floor(diffMs / 3_600_000)
}
