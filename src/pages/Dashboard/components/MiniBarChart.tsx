import React from 'react';
import { useInView } from '../../../hooks';

interface MiniBarDataPoint {
  value: number;
  label: string;
  highlight?: boolean;
}

interface MiniBarChartProps {
  data: MiniBarDataPoint[];
  width?: number;
  height?: number;
}

export const MiniBarChart: React.FC<MiniBarChartProps> = ({ 
  data, 
  width = 320, 
  height = 140 
}) => {
  const [ref, inView] = useInView();

  if (!data || data.length === 0) return null;

  const max = Math.max(...data.map(d => d.value)) * 1.15;
  const barW = Math.min(28, (width / data.length) * 0.55);
  const gap = width / data.length;

  return (
    <svg 
      ref={ref as React.RefObject<SVGSVGElement>} 
      width="100%" 
      viewBox={`0 0 ${width} ${height + 24}`} 
      style={{ display: 'block', maxWidth: width }}
    >
      {data.map((d, i) => {
        const barH = (d.value / max) * height;
        const x = i * gap + (gap - barW) / 2;
        return (
          <g key={i}>
            <rect
              x={x}
              y={inView ? height - barH : height}
              width={barW}
              height={inView ? barH : 0}
              rx={barW / 2}
              fill={d.highlight ? 'var(--primary)' : 'var(--border)'}
              style={{
                transition: `height 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 60}ms, y 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 60}ms`,
              }}
            />
            <text
              x={x + barW / 2}
              y={height + 16}
              textAnchor="middle"
              fontSize="10"
              fill="var(--text-4)"
              fontFamily="var(--font)"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
