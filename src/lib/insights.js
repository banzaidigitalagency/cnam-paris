// Lecture rapide : insights positifs, basés sur des règles (aucun LLM).
// Périmètre volontairement restreint : UNIQUEMENT ce qui concerne les ad copies
// (quel message performe le mieux). Pas de tendances / déroulement de campagne.
import {
  ctr,
  metaAdCopies,
  linkedinByAdCopy,
  pickWinner,
} from './derive.js'
import { fmtPct, fmtInt } from './format.js'

function winnerDetail(g) {
  return (g.conv || 0) > 0
    ? `${fmtInt(g.conv)} clics « S’inscrire »`
    : `meilleur taux de clic (CTR ${fmtPct(ctr(g.imp, g.clk), 2)})`
}

function scopeWinner(groups) {
  if (!groups || groups.length < 2) return null
  const w = pickWinner(groups)
  if (!w) return null
  return groups.find((g) => g.label === w) || null
}

export function buildInsights(data) {
  const insights = []
  if (!data) return { items: [], action: null }

  const metaCopies = data.meta?.adSets?.length ? metaAdCopies(data.meta.adSets) : []
  const liCopies = data.linkedin?.adSets?.length ? linkedinByAdCopy(data.linkedin.adSets) : []

  // Message gagnant toutes plateformes confondues.
  const combined = new Map()
  for (const g of [...metaCopies, ...liCopies]) {
    const s = combined.get(g.label) || { label: g.label, conv: 0, clk: 0, imp: 0 }
    s.conv += g.conv || 0
    s.clk += g.clk || 0
    s.imp += g.imp || 0
    combined.set(g.label, s)
  }
  const overall = scopeWinner([...combined.values()])
  if (overall) {
    insights.push({
      kind: 'message',
      title: 'Le message qui fait mouche',
      body: `« ${overall.label} » est le message qui performe le mieux toutes plateformes confondues — ${winnerDetail(overall)}.`,
    })
  }

  // Message gagnant sur Meta.
  const metaWin = scopeWinner(metaCopies)
  if (metaWin) {
    insights.push({
      kind: 'message',
      title: 'Sur Meta, un message se détache',
      body: `« ${metaWin.label} » est l'ad copy la plus performante sur Meta — ${winnerDetail(metaWin)}.`,
    })
  }

  // Message gagnant sur LinkedIn.
  const liWin = scopeWinner(liCopies)
  if (liWin) {
    insights.push({
      kind: 'message',
      title: 'Sur LinkedIn, un message se détache',
      body: `« ${liWin.label} » est l'ad copy la plus performante sur LinkedIn — ${winnerDetail(liWin)}.`,
    })
  }

  // Cas vide : pas encore assez de données pour départager les messages.
  if (insights.length === 0) {
    insights.push({
      kind: 'neutral',
      title: 'Test de messages en cours',
      body: 'Les messages testés accumulent encore de la donnée — le comparatif se précisera dans les prochains jours.',
    })
  }

  // Prochaine action : toujours orientée ad copy.
  const action = overall
    ? `Capitaliser sur le message « ${overall.label} » en lui donnant plus de place dans la diffusion, tout en gardant une variante en test pour continuer d'apprendre.`
    : 'Laisser les deux messages accumuler de la donnée, puis renforcer celui qui génère le plus de clics « S’inscrire ».'

  return { items: insights, action }
}
