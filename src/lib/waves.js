// Les deux vagues de la campagne CNAM Paris — Inscriptions.
// `launch` = première journée de diffusion possible (borne du preset
// « Depuis le lancement ») ; `end` = fin de vague (borne les presets relatifs
// d'une vague terminée). `progLines` = lignes programmatiques réellement
// programmées sur la vague (affichées même à 0).
export const WAVES = [
  {
    id: 'rentree',
    label: 'Vague rentrée',
    launch: '2026-08-23',
    end: '2026-09-30',
    progSubtitle: 'Display & Vidéo',
    progLines: ['IAB / Interstitiel', 'YouTube'],
  },
  {
    id: 'juin',
    label: 'Vague juin',
    launch: '2026-06-01',
    end: '2026-07-19',
    progSubtitle: 'DV360 · Display & Vidéo',
    progLines: ['IAB / Interstitiel', 'Outstream', 'YouTube'],
  },
]

// Onglet actif à l'ouverture du dashboard.
export const DEFAULT_WAVE_ID = 'rentree'

export function getWave(id) {
  return WAVES.find((w) => w.id === id) || WAVES[0]
}
