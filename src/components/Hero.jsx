import { fmtDateFR, hoursSince } from '../lib/format.js'

export default function Hero({ metaInfo, start, end }) {
  const h = hoursSince(metaInfo?.last_sync)
  const syncIdle = h == null
  const syncText = syncIdle
    ? 'En attente de synchronisation'
    : h === 0
      ? 'Données mises à jour il y a moins d’une heure'
      : `Données mises à jour il y a ${h} h`

  return (
    <section className="hero hero-solo">
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
    </section>
  )
}
