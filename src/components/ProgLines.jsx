import { fmtInt, fmtPct } from '../lib/format.js'
import { ctr, dv360Lines } from '../lib/derive.js'

// Tableau des lignes programmatiques de la vague (impressions, clics, CTR —
// pas de coût/conv). `lines` = lignes canoniques de la vague affichée.
export default function ProgLines({ adSets, lines: canonical }) {
  const lines = dv360Lines(adSets, canonical || undefined)
  if (!lines || lines.length === 0) return null

  return (
    <div className="panel">
      <div className="panel-head">
        <h3 className="panel-title">Lignes de diffusion</h3>
        <p className="panel-note">
          Répartition de la visibilité par environnement programmatique.
        </p>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Ligne</th>
            <th>Impressions</th>
            <th>Clics</th>
            <th>CTR</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.label}>
              <td className="cell-name">{l.label}</td>
              <td className="tnum">{fmtInt(l.imp)}</td>
              <td className="tnum">{fmtInt(l.clk)}</td>
              <td className="tnum">{fmtPct(ctr(l.imp, l.clk), 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
