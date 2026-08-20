import { fmtDateShortFR } from '../lib/format.js'
import { WAVES } from '../lib/waves.js'

// Onglets de vague (rentrée active à l'ouverture, cf. DEFAULT_WAVE_ID).
export default function WaveTabs({ waveId, onWave }) {
  return (
    <div className="wave-tabs" role="tablist" aria-label="Vagues de campagne">
      {WAVES.map((w) => (
        <button
          key={w.id}
          role="tab"
          aria-selected={waveId === w.id}
          className={`wave-tab ${waveId === w.id ? 'active' : ''}`}
          onClick={() => onWave(w.id)}
        >
          <span className="wt-label">{w.label}</span>
          <span className="wt-period tnum">
            {fmtDateShortFR(w.launch)} → {fmtDateShortFR(w.end)}
          </span>
        </button>
      ))}
    </div>
  )
}
