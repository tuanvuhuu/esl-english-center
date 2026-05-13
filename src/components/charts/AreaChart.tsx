import React from 'react';
import { useInView } from '../../hooks';

interface ChartDataPoint {
  value: number;
  label?: string;
}

interface AreaChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  color?: string;
}

export const AreaChart: React.FC<AreaChartProps> = ({ 
  data, 
  width = 200, 
  height = 60, 
  color = '#FF6B35' 
}) => {
  const [ref, inView] = useInView();

  if (!data || data.length < 2) return null;

  const max = Math.max(...data.map(d => d.value)) * 1.1;
  const min = Math.min(...data.map(d => d.value)) * 0.9;
  const range = max - min;

  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.value - min) / range) * (height - 8) - 4;
    return { x, y, str: `${x},${y}` };
  });

  const areaPath = `0,${height} ${pts.map(p => p.str).join(' ')} ${width},${height}`;
  const linePath = pts.map(p => p.str).join(' ');
  const gid = `g-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg 
      ref={ref as React.RefObject<SVGSVGElement>} 
      width="100%" 
      viewBox={`0 0 ${width} ${height}`} 
      style={{ display: 'block', maxWidth: width }}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPath}
        fill={`url(#${gid})`}
        style={{ opacity: inView ? 1 : 0, transition: 'opacity 0.8s ease 0.2s' }}
      />
      <polyline
        points={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ 
          strokeDasharray: inView ? '1000' : '0 1000', 
          transition: 'stroke-dasharray 1s ease 0.1s' 
        }}
      />
      <circle
        cx={pts[pts.length - 1].x}
        cy={pts[pts.length - 1].y}
        r="4"
        fill={color}
        stroke="var(--card)"
        strokeWidth="2.5"
        style={{
          opacity: inView ? 1 : 0,
          transition: 'opacity 0.3s ease 0.9s',
          filter: `drop-shadow(0 0 6px ${color}50)`,
        }}
      />
    </svg>
  );
};

export default AreaChart;
