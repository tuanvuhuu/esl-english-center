import React from 'react';
import { useInView } from '../../hooks';

interface DonutSegment {
  value: number;
  color: string;
  label?: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ 
  segments, 
  size = 130, 
  strokeWidth = 16 
}) => {
  const [ref, inView] = useInView();

  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * radius;
  const total = segments.reduce((a, s) => a + s.value, 0);

  let offset = 0;

  return (
    <svg 
      ref={ref as React.RefObject<SVGSVGElement>} 
      width={size} 
      height={size} 
      viewBox={`0 0 ${size} ${size}`}
    >
      {segments.map((s, i) => {
        const dashLen = (s.value / total) * circ;
        const dashOff = -offset;
        offset += dashLen;

        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth={strokeWidth}
            strokeDasharray={inView ? `${dashLen} ${circ - dashLen}` : `0 ${circ}`}
            strokeDashoffset={dashOff}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{
              transition: `stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1) ${i * 150}ms`,
            }}
          />
        );
      })}
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fontSize="22"
        fontWeight="800"
        fill="var(--text-1)"
        fontFamily="var(--font)"
      >
        {inView ? total : 0}
      </text>
      <text 
        x={cx} 
        y={cy + 12} 
        textAnchor="middle" 
        fontSize="11" 
        fill="var(--text-4)" 
        fontFamily="var(--font)"
      >
        học viên
      </text>
    </svg>
  );
};

export default DonutChart;
