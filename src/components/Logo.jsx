// Logo "le cnam" : tuile rouge arrondie avec texte blanc (pas d'image externe).
export default function Logo({ size = 52 }) {
  return (
    <span
      className="logo-tile"
      style={{ width: size, height: size }}
      aria-label="le cnam"
      role="img"
    >
      <span className="l-text" style={{ fontSize: size * 0.3 }}>
        <span style={{ fontWeight: 400 }}>le </span>
        <span style={{ fontWeight: 700 }}>cnam</span>
      </span>
    </span>
  )
}
