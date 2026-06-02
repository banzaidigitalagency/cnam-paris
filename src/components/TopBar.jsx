import Logo from './Logo.jsx'

const PRESETS = [
  { id: '7j', label: '7 j' },
  { id: '30j', label: '30 j' },
  { id: 'launch', label: 'Depuis le lancement' },
]

export default function TopBar({
  preset,
  onPreset,
  start,
  end,
  onStart,
  onEnd,
  minDate,
  maxDate,
}) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-brand">
          <Logo size={52} />
          <div className="topbar-titles">
            <div className="t-eyebrow">Reporting média</div>
            <div className="t-client">CNAM Paris — Inscriptions</div>
          </div>
        </div>

        <div className="topbar-actions">
          <div className="preset-group" role="group" aria-label="Périodes">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                className={`preset-btn ${preset === p.id ? 'active' : ''}`}
                onClick={() => onPreset(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="date-fields">
            <input
              type="date"
              value={start || ''}
              min={minDate || undefined}
              max={end || maxDate || undefined}
              onChange={(e) => onStart(e.target.value)}
              aria-label="Date de début"
            />
            <span className="sep">→</span>
            <input
              type="date"
              value={end || ''}
              min={start || minDate || undefined}
              max={maxDate || undefined}
              onChange={(e) => onEnd(e.target.value)}
              aria-label="Date de fin"
            />
          </div>

          <button className="btn-pdf" onClick={() => window.print()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M6 14h12v8H6z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            PDF
          </button>
        </div>
      </div>
    </header>
  )
}
