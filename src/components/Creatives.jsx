import { fmtInt, fmtPct } from '../lib/format.js'
import { ctr } from '../lib/derive.js'

// Tableau des meilleures créations (annonces) d'une plateforme.
export default function Creatives({ creatives, showConv = true }) {
  if (!creatives || creatives.length === 0) return null
  const rows = [...creatives].sort((a, b) => (b.clk || 0) - (a.clk || 0)).slice(0, 12)

  return (
    <div className="panel">
      <div className="panel-head">
        <h3 className="panel-title">Top créations</h3>
        <p className="panel-note">Annonces les plus performantes sur la période, par clics.</p>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Création</th>
            <th>Impressions</th>
            <th>Clics</th>
            <th>CTR</th>
            {showConv ? <th>Conversions</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((c, i) => (
            <tr key={c.name + i}>
              <td className="cell-name">{c.name}</td>
              <td className="tnum">{fmtInt(c.imp)}</td>
              <td className="tnum">{fmtInt(c.clk)}</td>
              <td className="tnum">{fmtPct(c.ctr != null ? c.ctr : ctr(c.imp, c.clk), 2)}</td>
              {showConv ? <td className="tnum">{fmtInt(c.conv)}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
