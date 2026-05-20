import React from 'react';
import { Card, Badge } from '../../../components';
import { MiniAreaChart } from './MiniAreaChart';
import { MiniBarChart } from './MiniBarChart';

interface AttendDataPoint {
  label: string;
  value: number;
  highlight: boolean;
}

interface RevenueChartProps {
  data?: { month: string; value: number }[];
  attendanceData?: AttendDataPoint[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data = [], attendanceData = [] }) => {
  const defaultAttendData: AttendDataPoint[] = [
    { label: 'T2', value: 0, highlight: false },
    { label: 'T3', value: 0, highlight: false },
    { label: 'T4', value: 0, highlight: false },
    { label: 'T5', value: 0, highlight: false },
    { label: 'T6', value: 0, highlight: false },
    { label: 'T7', value: 0, highlight: false },
    { label: 'CN', value: 0, highlight: false },
  ];

  const chartAttendData = attendanceData && attendanceData.length > 0 ? attendanceData : defaultAttendData;

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
        <MiniBarChart data={chartAttendData} width={420} height={80} />
      </div>
    </Card>
  );
};
