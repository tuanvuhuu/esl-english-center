import React from 'react';
import { Card, FadeIn } from '../../../components';
import { MiniDonutChart } from './MiniDonutChart';

interface DistributionSegment {
  label: string;
  value: number;
  color: string;
}

export const StudentDistribution: React.FC = () => {
  const segments: DistributionSegment[] = [
    { label: 'A1 · Starter', value: 68, color: '#FF6B35' },
    { label: 'A2 · Elementary', value: 82, color: '#3B82F6' },
    { label: 'B1 · Pre-Inter', value: 62, color: '#10B981' },
    { label: 'B2 · Intermediate', value: 33, color: '#8B5CF6' },
  ];

  return (
    <Card animate delay={100}>
      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)', marginBottom: 16 }}>Phân bổ trình độ</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
        <MiniDonutChart segments={segments} size={130} strokeWidth={16} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minWidth: 120 }}>
          {segments.map((s, i) => (
            <FadeIn key={i} delay={i * 80 + 400} direction="right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--text-2)', flex: 1 }}>{s.label}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{s.value}</span>
            </FadeIn>
          ))}
        </div>
      </div>
    </Card>
  );
};
