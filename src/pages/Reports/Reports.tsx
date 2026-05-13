import React from 'react';
import { PageHeader, Button, Card, Icon, IconName } from '../../components';

interface ReportItem {
  icon: IconName;
  title: string;
  desc: string;
  color: string;
  bg: string;
}

export const Reports: React.FC = () => {
  const reports: ReportItem[] = [
    { icon: 'users', title: 'Báo cáo học viên', desc: 'Thống kê nhập học, nghỉ học, chuyển lớp', color: '#FF6B35', bg: 'var(--primary-light)' },
    { icon: 'wallet', title: 'Báo cáo tài chính', desc: 'Doanh thu, chi phí, công nợ theo tháng', color: '#10B981', bg: 'var(--success-light)' },
    { icon: 'clipboard', title: 'Báo cáo điểm danh', desc: 'Tỷ lệ đi học, vắng mặt theo lớp', color: '#3B82F6', bg: 'var(--info-light)' },
    { icon: 'star', title: 'Báo cáo học tập', desc: 'Điểm trung bình, tiến bộ học viên', color: '#8B5CF6', bg: '#EDE9FE' },
    { icon: 'graduation', title: 'Báo cáo giáo viên', desc: 'Giờ dạy, đánh giá, phản hồi', color: '#F59E0B', bg: 'var(--warning-light)' },
    { icon: 'bar-chart', title: 'Tổng hợp', desc: 'Báo cáo tổng hợp toàn trung tâm', color: '#EC4899', bg: '#FCE7F3' },
  ];

  return (
    <div>
      <PageHeader
        title="Báo cáo & Thống kê"
        subtitle="Xem tổng quan hoạt động trung tâm"
        actions={<Button icon="download" variant="secondary">Xuất báo cáo</Button>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {reports.map((r, i) => (
          <Card key={i} hover animate delay={i * 60} style={{ cursor: 'pointer' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: r.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: r.color,
                marginBottom: 14,
              }}
            >
              <Icon name={r.icon} size={22} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>{r.title}</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{r.desc}</div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Reports;
