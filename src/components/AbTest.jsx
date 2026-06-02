import { fmtInt, fmtPct } from '../lib/format.js'
import { ctr, pickWinner } from '../lib/derive.js'

// Bloc A/B "Quel message gagne ?" — compare 2 ad copies, gagnant mis en avant.
export default function AbTest({ groups, title = 'Quel message gagne ?' }) {
  if (!groups || groups.length === 0) return null
  const winner = pickWinner(groups)

  return (
    <div>
      <div className="panel-head" style={{ padding: '0 2px 16px', border: 0 }}>
        <h3 className="panel-title">{title}</h3>
        <p className="panel-note">
          Comparaison des messages testés. Le gagnant est désigné sur les
          inscriptions (à défaut, le taux de clic).
        </p>
      </div>
      <div className="ab-wrap">
        {groups.map((g) => (
          <AbCard key={g.label} group={g} isWinner={g.label === winner} />
        ))}
      </div>
    </div>
  )
}

function AbCard({ group, isWinner }) {
  const metrics = [
    { label: 'Impressions', value: fmtInt(group.imp) },
    { label: 'Clics', value: fmtInt(group.clk) },
    { label: 'CTR', value: fmtPct(ctr(group.imp, group.clk), 2) },
    { label: 'Conversions', value: fmtInt(group.conv) },
  ]
  return (
    <div className={`ab-card ${isWinner ? 'winner' : ''}`}>
      {isWinner ? (
        <span className="ab-badge">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9l6.9-.7z" />
          </svg>
          Message gagnant
        </span>
      ) : (
        <span className="ab-badge" style={{ color: 'var(--muted-2)', background: 'transparent', paddingLeft: 0 }}>
          Variante testée
        </span>
      )}
      <p className="ab-copy">« {group.label} »</p>
      <div className="ab-metrics">
        {metrics.map((m) => (
          <div className="ab-metric" key={m.label}>
            <div className="m-label">{m.label}</div>
            <div className="m-value tnum">{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
