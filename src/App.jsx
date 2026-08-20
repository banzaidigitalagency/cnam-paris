import { useEffect, useMemo, useState } from 'react'
import { fetchDashboard } from './lib/api.js'
import { toISODate, parseISO } from './lib/format.js'
import { DEFAULT_WAVE_ID, getWave } from './lib/waves.js'
import {
  metaAdCopies,
  linkedinByAdCopy,
  linkedinByFormat,
} from './lib/derive.js'

import TopBar from './components/TopBar.jsx'
import WaveTabs from './components/WaveTabs.jsx'
import Hero from './components/Hero.jsx'
import KpiRow from './components/KpiRow.jsx'
import PlatformSection from './components/PlatformSection.jsx'
import AbTest from './components/AbTest.jsx'
import FormatBreakdown from './components/FormatBreakdown.jsx'
import Creatives from './components/Creatives.jsx'
import ProgLines from './components/ProgLines.jsx'
import QuickRead from './components/QuickRead.jsx'
import Footer from './components/Footer.jsx'

// Décale une date ISO (YYYY-MM-DD) de n jours.
function addDaysISO(iso, n) {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

// Plage d'un preset, bornée à la vague : les presets relatifs (7 j / 30 j)
// sont calés sur aujourd'hui plafonné à la fin de vague (utile pour la vague
// juin, terminée), et « Depuis le lancement » part du lancement de la vague.
function rangeForPreset(preset, wave) {
  const today = toISODate(new Date())
  let end = wave.end && today > wave.end ? wave.end : today
  let start
  if (preset === '7j') start = addDaysISO(end, -6)
  else if (preset === '30j') start = addDaysISO(end, -29)
  else start = wave.launch // launch
  if (end < start) end = start // vague pas encore lancée
  return { start, end }
}

export default function App() {
  const [waveId, setWaveId] = useState(DEFAULT_WAVE_ID)
  const wave = getWave(waveId)

  const [preset, setPreset] = useState('launch')
  const initial = rangeForPreset('launch', getWave(DEFAULT_WAVE_ID))
  const [start, setStart] = useState(initial.start)
  const [end, setEnd] = useState(initial.end)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Application d'un preset -> recalcule les dates.
  function applyPreset(p) {
    setPreset(p)
    const r = rangeForPreset(p, wave)
    setStart(r.start)
    setEnd(r.end)
  }

  // Changement de vague -> retour au preset « Depuis le lancement » de la vague.
  function applyWave(id) {
    if (id === waveId) return
    setWaveId(id)
    setPreset('launch')
    const r = rangeForPreset('launch', getWave(id))
    setStart(r.start)
    setEnd(r.end)
  }

  // Saisie manuelle d'une date -> bascule en mode personnalisé.
  function onStart(v) {
    setStart(v)
    setPreset('custom')
  }
  function onEnd(v) {
    setEnd(v)
    setPreset('custom')
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchDashboard({ start, end, wave: waveId })
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Erreur inconnue')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [start, end, waveId])

  const present = data?.meta_info?.platforms_present || {}

  const metaCopies = useMemo(
    () => (data?.meta?.adSets ? metaAdCopies(data.meta.adSets) : []),
    [data]
  )
  const liCopies = useMemo(
    () => (data?.linkedin?.adSets ? linkedinByAdCopy(data.linkedin.adSets) : []),
    [data]
  )
  const liFormats = useMemo(
    () => (data?.linkedin?.adSets ? linkedinByFormat(data.linkedin.adSets) : []),
    [data]
  )

  const minDate = data?.meta_info?.min_date
  const maxDate = data?.meta_info?.max_date

  return (
    <>
      <TopBar
        preset={preset}
        onPreset={applyPreset}
        start={start}
        end={end}
        onStart={onStart}
        onEnd={onEnd}
        minDate={minDate}
        maxDate={maxDate}
      />

      <main className="shell">
        <WaveTabs waveId={waveId} onWave={applyWave} />

        {loading ? (
          <div className="center-screen">
            <div className="spinner" />
            <p>Chargement des données…</p>
          </div>
        ) : error ? (
          <div className="center-screen">
            <p style={{ color: 'var(--neg)', fontWeight: 600 }}>
              Impossible de charger les données.
            </p>
            <p style={{ fontSize: 14 }}>{error}</p>
          </div>
        ) : (
          <>
            <Hero
              metaInfo={data?.meta_info}
              global={data?.global}
              start={start}
              end={end}
            />

            <section className="section" style={{ marginTop: 8 }}>
              <div className="section-head">
                <span className="section-index">/00</span>
                <h2 className="section-title">Vue d’ensemble</h2>
                <span className="section-sub">
                  Toutes plateformes confondues
                </span>
              </div>
              <KpiRow block={data?.global} />
            </section>

            {/* /01 Meta */}
            <PlatformSection
              index="01"
              logo="meta"
              title="Meta"
              subtitle="Facebook · Instagram"
              present={present.meta}
              block={data?.meta}
            >
              <Creatives creatives={data?.meta?.creatives} showConv />
              <AbTest groups={metaCopies} />
            </PlatformSection>

            {/* /02 LinkedIn */}
            <PlatformSection
              index="02"
              logo="linkedin"
              title="LinkedIn"
              subtitle="Campagnes sponsorisées"
              present={present.linkedin}
              block={data?.linkedin}
            >
              <FormatBreakdown groups={liFormats} />
              <AbTest groups={liCopies} />
              <Creatives creatives={data?.linkedin?.creatives} showConv />
            </PlatformSection>

            {/* /03 Programmatique */}
            <PlatformSection
              index="03"
              logo="prog"
              title="Programmatique"
              subtitle={wave.progSubtitle}
              present={present.dv360}
              block={data?.dv360}
              simple
            >
              <ProgLines adSets={data?.dv360?.adSets} lines={wave.progLines} />
            </PlatformSection>

            {/* /04 Lecture rapide */}
            <QuickRead data={data} />

            <Footer />
          </>
        )}
      </main>
    </>
  )
}
