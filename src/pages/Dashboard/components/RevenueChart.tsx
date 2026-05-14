import React from 'react';
import { Card, Badge } from '../../../components';
import { REVENUE_MONTHLY } from '../../../data';
import { MiniAreaChart } from './MiniAreaChart';
import { MiniBarChart } from './MiniBarChart';

interface AttendDataPoint {
  label: string;
  value: number;
  highlight: boolean;
}

interface RevenueChartProps {
  data?: { month: string; value: number }[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data = [] }) => {
  const attendData: AttendDataPoint[] = [
    { label: 'T2', value: 42, highlight: false },
    { label: 'T3', value: 38, highlight: false },
    { label: 'T4', value: 45, highlight: false },
    { label: 'T5', value: 40, highlight: false },
    { label: 'T6', value: 44, highlight: true },
    { label: 'T7', value: 52, highlight: true },
    { label: 'CN', value: 24, highlight: false },
  ];

  return (
    <Card animate delay={80} style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>Doanh thu 8 tháng</div>
        <Badge variant="success">+8.2%</Badge>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-4)', marginBottom: 16 }}>Triệu VNĐ</div>
      <MiniAreaChart data={data} width={420} height={100} color="#FF6B35" />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, padding: '0 2px' }}>
        {data.map((d, i) => (
          <span key={i} style={{ fontSize: 10, color: 'var(--text-4)' }}>
            {d.month}
          </span>
        ))}
      </div>
      <div style={{ marginTop: 20, borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)', marginBottom: 12 }}>Lượt học theo ngày</div>
        <MiniBarChart data={attendData} width={420} height={80} />
      </div>
    </Card>
  );
};
