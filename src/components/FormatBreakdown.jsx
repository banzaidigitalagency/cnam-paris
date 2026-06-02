import { fmtInt, fmtPct } from '../lib/format.js'
import { ctr } from '../lib/derive.js'

// Répartition LinkedIn par format (Image vs Vidéo).
export default function FormatBreakdown({ groups }) {
  if (!groups || groups.length === 0) return null
  return (
    <div className="panel">
      <div className="panel-head">
        <h3 className="panel-title">Image vs Vidéo</h3>
        <p className="panel-note">Performance comparée des deux formats diffusés sur LinkedIn.</p>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Format</th>
            <th>Impressions</th>
            <th>Clics</th>
            <th>CTR</th>
            <th>Conversions</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <tr key={g.label}>
              <td className="cell-name">{g.label}</td>
              <td className="tnum">{fmtInt(g.imp)}</td>
              <td className="tnum">{fmtInt(g.clk)}</td>
              <td className="tnum">{fmtPct(ctr(g.imp, g.clk), 2)}</td>
              <td className="tnum">{fmtInt(g.conv)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
