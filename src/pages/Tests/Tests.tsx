import React from 'react';
import { PageHeader, Button, Card, Badge } from '../../components';

interface TestItem {
  id: number;
  name: string;
  className: string;
  date: string;
  type: string;
  status: 'upcoming' | 'completed';
  students: number;
  avgScore?: number;
}

export const Tests: React.FC = () => {
  const tests: TestItem[] = [
    { id: 1, name: 'Mid-term Test', className: 'Kids Elementary A', date: '20/05/2026', type: 'Giữa kỳ', status: 'upcoming', students: 14 },
    { id: 2, name: 'Unit 5 Quiz', className: 'Teen Pre-Inter A', date: '15/05/2026', type: 'Quiz', status: 'upcoming', students: 15 },
    { id: 3, name: 'Speaking Test', className: 'Kids Starter A', date: '10/05/2026', type: 'Kỹ năng', status: 'completed', students: 12, avgScore: 82 },
    { id: 4, name: 'Final Test', className: 'IELTS Prep', date: '05/05/2026', type: 'Cuối kỳ', status: 'completed', students: 6, avgScore: 78 },
    { id: 5, name: 'Unit 4 Quiz', className: 'Kids Elementary B', date: '01/05/2026', type: 'Quiz', status: 'completed', students: 11, avgScore: 88 },
  ];

  return (
    <div>
      <PageHeader
        title="Kiểm tra & Thi"
        subtitle="Quản lý bài kiểm tra và kết quả"
        actions={<Button icon="plus">Tạo bài kiểm tra</Button>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {tests.map((t, i) => (
          <Card key={t.id} hover animate delay={i * 60}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Badge variant={t.status === 'upcoming' ? 'warning' : 'success'}>
                {t.status === 'upcoming' ? 'Sắp tới' : 'Hoàn thành'}
              </Badge>
              <span style={{ fontSize: 12, color: 'var(--text-4)' }}>{t.date}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>{t.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12 }}>
              {t.className} · {t.type}
            </div>
            {t.avgScore && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                  <span style={{ color: 'var(--text-4)' }}>Điểm trung bình</span>
                  <span style={{ fontWeight: 700, color: t.avgScore >= 80 ? 'var(--success)' : 'var(--warning)' }}>
                    {t.avgScore}/100
                  </span>
                </div>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${t.avgScore}%`,
                      background: t.avgScore >= 80 ? 'var(--success)' : 'var(--warning)',
                      borderRadius: 3,
                      transition: 'width 0.8s ease',
                    }}
                  />
                </div>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0 0',
                borderTop: '1px solid var(--border-light)',
                fontSize: 13,
              }}
            >
              <span style={{ color: 'var(--text-3)' }}>{t.students} học viên</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Tests;
