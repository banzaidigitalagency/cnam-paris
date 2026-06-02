import { fmtInt, fmtDateFR, pctChange, fmtDelta, hoursSince } from '../lib/format.js'
import { isAllZero } from '../lib/derive.js'

export default function Hero({ metaInfo, global, start, end }) {
  const h = hoursSince(metaInfo?.last_sync)
  const syncIdle = h == null
  const syncText = syncIdle
    ? 'En attente de synchronisation'
    : h === 0
      ? 'Données mises à jour il y a moins d’une heure'
      : `Données mises à jour il y a ${h} h`

  const conv = global?.current?.conv ?? 0
  const prevConv = global?.previous?.conv
  const noPrev = isAllZero(global?.previous)
  const delta = noPrev ? null : pctChange(conv, prevConv)

  return (
    <section className="hero">
      <div>
        <div className="hero-sync">
          <span className={`dot ${syncIdle ? 'idle' : ''}`} />
          {syncText}
        </div>
        <h1 className="hero-title">
          Performance
          <br />
          <span className="red">des campagnes.</span>
        </h1>
        <p className="hero-period">
          Période analysée :{' '}
          <strong>{fmtDateFR(start)}</strong> → <strong>{fmtDateFR(end)}</strong>
        </p>
      </div>

      <div className="hero-card">
        <div className="hc-label">Inscriptions générées</div>
        <div className="hc-value tnum">{fmtInt(conv)}</div>
        <div className="hc-delta">
          {noPrev ? 'Première période de référence' : `${fmtDelta(delta)} vs période précédente`}
        </div>
      </div>
    </section>
  )
}
