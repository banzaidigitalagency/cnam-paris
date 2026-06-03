import logoUrl from '../assets/cnam-logo.jpeg'

// Logo officiel "le cnam".
export default function Logo({ size = 52 }) {
  return (
    <img
      src={logoUrl}
      alt="le cnam"
      width={size}
      height={size}
      className="logo-tile-img"
    />
  )
}
