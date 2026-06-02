import Sparkline from './Sparkline.jsx'
import {
  fmtInt,
  fmtEur,
  fmtPct,
  pctChange,
  fmtDelta,
} from '../lib/format.js'
import { ctr, cpa, isAllZero } from '../lib/derive.js'

// Ligne de KPI globaux : Impressions, Clics, CTR, Conversions, Coût, CPA.
export default function KpiRow({ block }) {
  if (!block) return null
  const cur = block.current || {}
  const prev = block.previous || {}
  const noPrev = isAllZero(prev)

  const curCtr = ctr(cur.imp, cur.clk)
  const prevCtr = ctr(prev.imp, prev.clk)
  const curCpa = cpa(cur.spend, cur.conv)
  const prevCpa = cpa(prev.spend, prev.conv)

  const cards = [
    {
      label: 'Impressions',
      value: fmtInt(cur.imp),
      delta: noPrev ? null : pctChange(cur.imp, prev.imp),
      spark: 'imp',
    },
    {
      label: 'Clics',
      value: fmtInt(cur.clk),
      delta: noPrev ? null : pctChange(cur.clk, prev.clk),
      spark: 'clk',
    },
    {
      label: 'CTR',
      value: fmtPct(curCtr, 2),
      delta: noPrev ? null : pctChange(curCtr, prevCtr),
      spark: 'ctr',
    },
    {
      label: 'Conversions (inscriptions)',
      value: fmtInt(cur.conv),
      delta: noPrev ? null : pctChange(cur.conv, prev.conv),
      spark: 'conv',
    },
    {
      label: 'Coût',
      value: fmtEur(cur.spend, 2),
      delta: noPrev ? null : pctChange(cur.spend, prev.spend),
      spark: 'spend',
      // pour le coût, hausse = plus d'investissement, on garde neutre via invert
      invert: true,
    },
    {
      label: 'CPA',
      value: fmtEur(curCpa, 2),
      delta: noPrev ? null : pctChange(curCpa, prevCpa),
      invert: true,
    },
  ]

  return (
    <div className="kpi-grid">
      {cards.map((c) => (
        <KpiCard key={c.label} {...c} daily={block.daily} />
      ))}
    </div>
  )
}

function KpiCard({ label, value, delta, spark, daily, invert }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value tnum">{value}</div>
      <div className="kpi-foot">
        <DeltaTag delta={delta} invert={invert} />
        {spark ? <Sparkline data={daily} dataKey={spark} /> : <span />}
      </div>
    </div>
  )
}

export function DeltaTag({ delta, invert = false }) {
  if (delta == null) return <span className="delta ref">réf.</span>
  // Pour les métriques "coût", une baisse est positive.
  const good = invert ? delta <= 0 : delta >= 0
  return <span className={`delta ${good ? 'pos' : 'neg'}`}>{fmtDelta(delta)}</span>
}
