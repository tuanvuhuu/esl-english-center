import React from 'react'

interface RadarAxis {
  key: string
  label: string
}

interface RadarSeries {
  label: string
  color: string
  values: Record<string, number | null>
}

interface RadarChartProps {
  axes: RadarAxis[]
  series: RadarSeries[]
  size?: number
  maxValue?: number
}

export const RadarChart: React.FC<RadarChartProps> = ({
  axes,
  series,
  size = 240,
  maxValue = 100,
}) => {
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38
  const levels = 4

  const angleOf = (i: number) => (Math.PI * 2 * i) / axes.length - Math.PI / 2

  const toXY = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  })

  // Grid circles
  const gridCircles = Array.from({ length: levels }, (_, i) => (i + 1) / levels * r)

  // Axis lines and labels
  const axisLines = axes.map((axis, i) => {
    const angle = angleOf(i)
    const end = toXY(angle, r)
    const labelPos = toXY(angle, r + 22)
    return { axis, end, labelPos, angle }
  })

  // Series polygons
  const polygons = series.map(s => {
    const pts = axes.map((axis, i) => {
      const val = s.values[axis.key]
      const ratio = val !== null && val !== undefined ? Math.min(val / maxValue, 1) : 0
      const angle = angleOf(i)
      return toXY(angle, ratio * r)
    })
    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') + ' Z'
    return { ...s, path, pts }
  })

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Grid rings */}
      {gridCircles.map((radius, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={1}
          opacity={0.6}
        />
      ))}

      {/* Axis lines */}
      {axisLines.map(({ end }, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={end.x}
          y2={end.y}
          stroke="var(--border)"
          strokeWidth={1}
          opacity={0.7}
        />
      ))}

      {/* Data polygons */}
      {polygons.map((s, si) => (
        <g key={si}>
          <path
            d={s.path}
            fill={s.color}
            fillOpacity={0.18}
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {s.pts.map((pt, pi) => (
            <circle key={pi} cx={pt.x} cy={pt.y} r={3} fill={s.color} />
          ))}
        </g>
      ))}

      {/* Axis labels */}
      {axisLines.map(({ axis, labelPos }, i) => {
        const isLeft = labelPos.x < cx - 5
        const textAnchor = isLeft ? 'end' : labelPos.x > cx + 5 ? 'start' : 'middle'
        return (
          <text
            key={i}
            x={labelPos.x}
            y={labelPos.y + 4}
            textAnchor={textAnchor}
            fontSize="11"
            fontWeight="600"
            fill="var(--text-2)"
            fontFamily="var(--font)"
          >
            {axis.label}
          </text>
        )
      })}

      {/* Score labels on axes (max value) */}
      <text
        x={cx}
        y={cy - r - 4}
        textAnchor="middle"
        fontSize="9"
        fill="var(--text-4)"
        fontFamily="var(--font)"
      >
        {maxValue}
      </text>
    </svg>
  )
}
