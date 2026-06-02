import { fmtEur, fmtDateFR, pctChange, fmtDelta, hoursSince } from '../lib/format.js'
import { isAllZero } from '../lib/derive.js'

export default function Hero({ metaInfo, global, start, end }) {
  const h = hoursSince(metaInfo?.last_sync)
  const syncIdle = h == null
  const syncText = syncIdle
    ? 'En attente de synchronisation'
    : h === 0
      ? 'Données mises à jour il y a moins d’une heure'
      : `Données mises à jour il y a ${h} h`

  const spend = global?.current?.spend ?? 0
  const prevSpend = global?.previous?.spend
  const noPrev = isAllZero(global?.previous)
  const delta = noPrev ? null : pctChange(spend, prevSpend)

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
        <div className="hc-label">Investissement média total</div>
        <div className="hc-value tnum">{fmtEur(spend, 2)}</div>
        <div className="hc-delta">
          {noPrev ? 'Première période de référence' : `${fmtDelta(delta)} vs période précédente`}
        </div>
      </div>
    </section>
  )
}
