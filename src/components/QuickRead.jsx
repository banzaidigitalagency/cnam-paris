import { buildInsights } from '../lib/insights.js'

// Lecture rapide : insights positifs + prochaine action.
export default function QuickRead({ data }) {
  const { items, action } = buildInsights(data)

  return (
    <section className="section">
      <div className="section-head">
        <span className="section-index">/04</span>
        <h2 className="section-title">Lecture rapide</h2>
        <span className="section-sub">Ce qu’il faut retenir de la période</span>
      </div>

      <div className="qr-grid">
        {items.map((it, i) => (
          <div className="qr-card" key={i}>
            <p className="qr-title">{it.title}</p>
            <p className="qr-body">{it.body}</p>
          </div>
        ))}
      </div>

      {action ? (
        <div className="qr-action">
          <div className="qa-label">Prochaine action</div>
          <div className="qa-body">{action}</div>
        </div>
      ) : null}
    </section>
  )
}
