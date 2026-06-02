// Lecture rapide : insights positifs, basés sur des règles (aucun LLM).
// Ne jamais présenter un chiffre faible comme un problème (budgets, démarrage).
import {
  ctr,
  metaAdCopies,
  linkedinByAdCopy,
  dv360Lines,
  pickWinner,
} from './derive.js'
import { fmtPct, fmtInt } from './format.js'

// Benchmarks indicatifs de CTR par environnement.
const BENCH = {
  meta: 1.5, // social feed
  linkedin: 0.5, // LinkedIn payant
}

export function buildInsights(data) {
  const insights = []
  if (!data) return { items: [], action: null }

  const meta = data.meta
  const linkedin = data.linkedin
  const dv360 = data.dv360

  // --- Meilleur message (ad copy) toutes plateformes confondues ---
  const copyScores = new Map() // label -> {conv, clk, imp}
  const addCopies = (groups) => {
    for (const g of groups) {
      const s = copyScores.get(g.label) || { conv: 0, clk: 0, imp: 0 }
      s.conv += g.conv || 0
      s.clk += g.clk || 0
      s.imp += g.imp || 0
      copyScores.set(g.label, s)
    }
  }
  if (meta?.adSets?.length) addCopies(metaAdCopies(meta.adSets))
  if (linkedin?.adSets?.length) addCopies(linkedinByAdCopy(linkedin.adSets))

  if (copyScores.size >= 2) {
    const groups = [...copyScores.entries()].map(([label, s]) => ({
      label,
      ...s,
    }))
    const winner = pickWinner(groups)
    if (winner) {
      const w = groups.find((g) => g.label === winner)
      const detail =
        (w.conv || 0) > 0
          ? `${fmtInt(w.conv)} clics « S’inscrire »`
          : `meilleur taux d'engagement (CTR ${fmtPct(ctr(w.imp, w.clk), 2)})`
      insights.push({
        kind: 'message',
        title: 'Le message qui fait mouche',
        body: `« ${winner} » est le message qui performe le mieux sur l'ensemble des leviers — ${detail}.`,
      })
    }
  }

  // --- CTR fort vs benchmark : Meta ---
  if (meta?.current) {
    const c = ctr(meta.current.imp, meta.current.clk)
    if (c != null && c >= BENCH.meta) {
      insights.push({
        kind: 'ctr',
        title: 'Engagement Meta au-dessus du marché',
        body: `Le CTR Meta atteint ${fmtPct(c, 2)}, soit nettement au-dessus du repère habituel (~${BENCH.meta} %). Les créations accrochent leur audience.`,
      })
    }
  }

  // --- CTR fort vs benchmark : LinkedIn ---
  if (linkedin?.current) {
    const c = ctr(linkedin.current.imp, linkedin.current.clk)
    if (c != null && c >= BENCH.linkedin) {
      insights.push({
        kind: 'ctr',
        title: 'LinkedIn capte une audience qualifiée',
        body: `Le CTR LinkedIn s'établit à ${fmtPct(c, 2)}, au niveau ou au-dessus du repère habituel (~${BENCH.linkedin} %) sur une cible exigeante.`,
      })
    }
  }

  // --- Tendance conversions (inscriptions) ---
  const totalConv =
    (meta?.current?.conv || 0) +
    (linkedin?.current?.conv || 0) +
    (dv360?.current?.conv || 0)
  if (totalConv > 0) {
    insights.push({
      kind: 'conv',
      title: 'Les premiers clics « S’inscrire »',
      body: `${fmtInt(totalConv)} clics sur le bouton « S’inscrire » déjà enregistrés sur la période — la dynamique est enclenchée.`,
    })
  }

  // --- Meilleure ligne programmatique (couverture) ---
  if (dv360?.adSets?.length) {
    const lines = dv360Lines(dv360.adSets)
    if (lines.length) {
      const top = [...lines].sort((a, b) => b.imp - a.imp)[0]
      if (top && top.imp > 0) {
        insights.push({
          kind: 'prog',
          title: 'Une couverture programmatique solide',
          body: `La ligne « ${top.label} » assure la plus large visibilité avec ${fmtInt(
            top.imp
          )} impressions — un socle de notoriété pour la campagne.`,
        })
      }
    }
  }

  // --- Cas vide : campagne tout juste lancée ---
  if (insights.length === 0) {
    insights.push({
      kind: 'neutral',
      title: 'Campagne tout juste lancée',
      body: 'Campagne tout juste lancée — les premiers résultats arrivent. Les indicateurs se rempliront dès la première synchronisation des données.',
    })
  }

  // --- Prochaine action constructive ---
  const action = buildNextAction(data, copyScores)

  return { items: insights, action }
}

function buildNextAction(data, copyScores) {
  // Si on a un message gagnant clair, suggérer de capitaliser dessus.
  if (copyScores && copyScores.size >= 2) {
    const groups = [...copyScores.entries()].map(([label, s]) => ({
      label,
      ...s,
    }))
    const winner = pickWinner(groups)
    if (winner) {
      return `Capitaliser sur le message « ${winner} » en lui donnant plus de place dans la diffusion, tout en gardant une variante en test pour continuer d'apprendre.`
    }
  }
  // Programmatique présente -> suggérer le retargeting des audiences exposées.
  if (data?.dv360?.current?.imp) {
    return 'Activer un retargeting des audiences exposées en programmatique pour transformer la notoriété acquise en clics vers l’inscription.'
  }
  return 'Laisser les campagnes accumuler de la donnée sur les prochains jours, puis renforcer les formats les plus engageants.'
}
