import { fmtDateFR, toISODate } from '../lib/format.js'

export default function Footer() {
  const today = fmtDateFR(toISODate(new Date()))
  return (
    <footer className="footer">
      Reporting généré le {today} · Source : entrepôt média · Préparé par Banzai
      Digital Agency pour CNAM Paris
    </footer>
  )
}
