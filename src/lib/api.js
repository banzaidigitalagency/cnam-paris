// Accès aux données du dashboard : API live ou fixture de démo.
import { demoData } from './demoData.js'

const API_URL = import.meta.env.VITE_API_URL

// Détermine si on doit servir la démo (variable d'env OU ?demo=1 dans l'URL).
export function isDemoMode() {
  if (import.meta.env.VITE_DEMO === '1') return true
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    if (params.get('demo') === '1') return true
  }
  return false
}

export async function fetchDashboard({ start, end, wave }) {
  if (isDemoMode()) {
    // Latence simulée pour exercer l'état de chargement.
    await new Promise((r) => setTimeout(r, 250))
    return demoData({ start, end, wave })
  }

  if (!API_URL) {
    throw new Error("VITE_API_URL n'est pas configurée.")
  }

  const url = new URL(API_URL)
  if (start) url.searchParams.set('start', start)
  if (end) url.searchParams.set('end', end)
  if (wave) url.searchParams.set('wave', wave)

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`Erreur API (${res.status})`)
  }
  return res.json()
}
