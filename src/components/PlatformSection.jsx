import { fmtInt, fmtPct } from '../lib/format.js'
import { ctr } from '../lib/derive.js'

// En-tête de section + état vide gracieux + bandeau de KPI plateforme.
export default function PlatformSection({
  index,
  title,
  subtitle,
  present,
  block,
  simple = false,
  children,
}) {
  return (
    <section className="section">
      <div className="section-head">
        <span className="section-index">/{index}</span>
        <h2 className="section-title">{title}</h2>
        {subtitle ? <span className="section-sub">{subtitle}</span> : null}
      </div>

      {!present || !block ? (
        <EmptyState />
      ) : (
        <>
          <PlatformKpiStrip block={block} simple={simple} />
          <div className="stack">{children}</div>
        </>
      )}
    </section>
  )
}

export function EmptyState({
  text = 'Campagne en démarrage — les données s’afficheront dès la première synchronisation.',
}) {
  return (
    <div className="empty-state">
      <div className="es-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 6v6l4 2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
      <p className="es-text">{text}</p>
    </div>
  )
}

function PlatformKpiStrip({ block, simple }) {
  const cur = block.current || {}
  // Prog (simple): impressions, clics, CTR. Sinon on ajoute les conversions.
  const cards = simple
    ? [
        { label: 'Impressions', value: fmtInt(cur.imp) },
        { label: 'Clics', value: fmtInt(cur.clk) },
        { label: 'CTR', value: fmtPct(ctr(cur.imp, cur.clk), 2) },
      ]
    : [
        { label: 'Impressions', value: fmtInt(cur.imp) },
        { label: 'Clics', value: fmtInt(cur.clk) },
        { label: 'CTR', value: fmtPct(ctr(cur.imp, cur.clk), 2) },
        { label: 'Clics « S’inscrire »', value: fmtInt(cur.conv) },
      ]
  return (
    <div className="kpi-strip">
      {cards.map((c) => (
        <div className="kpi-card" key={c.label}>
          <div className="kpi-label">{c.label}</div>
          <div className="kpi-value tnum">{c.value}</div>
        </div>
      ))}
    </div>
  )
}
