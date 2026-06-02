import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts'

// Mini-courbe d'aire. On filtre les jours zéro en tête pour éviter une courbe plate.
export default function Sparkline({ data, dataKey, color = 'var(--brand-red)' }) {
  const series = trimLeadingZeros(data || [], dataKey)
  if (series.length < 2) return <div className="kpi-spark" />

  const gid = `sg-${dataKey}-${Math.round(Math.random() * 1e6)}`
  return (
    <div className="kpi-spark">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.8}
            fill={`url(#${gid})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function trimLeadingZeros(data, key) {
  let i = 0
  while (i < data.length && !(data[i]?.[key] > 0)) i++
  const sliced = data.slice(i)
  return sliced.length >= 2 ? sliced : data
}
