import React, { useState } from 'react';
import { PageHeader, Button, Card, Tabs } from '../../components';
import { CLASSES_DATA } from '../../data';

export const Schedule: React.FC = () => {
  const [viewType, setViewType] = useState('week');
  const [tooltip, setTooltip] = useState<string | number | null>(null);

  const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
  const dayMap = [1, 2, 3, 4, 5, 6, 0];
  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
  const lvlC: Record<string, string> = { 
    'A1': '#FF6B35', 'A2': '#3B82F6', 'B1': '#10B981', 'B2': '#8B5CF6', 
    'B2+': '#8B5CF6', 'A1-A2': '#F59E0B', 'All': '#EC4899' 
  };

  const getPos = (t: string) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return (h - 8) * 60 + (m || 0);
  };
  const getH = (s: string, e: string) => getPos(e) - getPos(s);
  const getDay = (di: number) => CLASSES_DATA.filter(c => c.days && c.days.includes(dayMap[di]));

  return (
    <div>
      <PageHeader
        title="Lịch học"
        subtitle="Thời khoá biểu tuần · 11/05 – 17/05/2026"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Tabs
              tabs={[
                { id: 'week', label: 'Tuần' },
                { id: 'day', label: 'Ngày' },
              ]}
              active={viewType}
              onChange={setViewType}
            />
            <Button icon="download" variant="secondary" size="sm">
              Xuất PDF
            </Button>
          </div>
        }
      />

      <Card animate style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '72px repeat(7, 1fr)', minWidth: 900 }}>
            <div style={{ padding: '14px 8px', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border-light)', background: 'var(--table-header)' }} />
            {days.map((d, i) => (
              <div
                key={i}
                style={{
                  padding: '14px 12px',
                  borderBottom: '1px solid var(--border)',
                  borderRight: i < 6 ? '1px solid var(--border-light)' : 'none',
                  background: 'var(--table-header)',
                  textAlign: 'center',
                  transition: 'background 0.35s',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>{d}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', marginTop: 2 }}>{11 + i}</div>
              </div>
            ))}
            <div style={{ position: 'relative' }}>
              {hours.map((_, i) => (
                <div key={i} style={{ height: 60, borderBottom: '1px solid var(--border-light)', borderRight: '1px solid var(--border-light)' }} />
              ))}
              {hours.map((h, i) => (
                <div key={`l${i}`} style={{ position: 'absolute', top: i * 60 - 7, right: 8, fontSize: 11, color: 'var(--text-4)', fontWeight: 500 }}>
                  {h}
                </div>
              ))}
            </div>
            {days.map((_, di) => {
              const dc = getDay(di);
              return (
                <div
                  key={di}
                  style={{
                    position: 'relative',
                    height: hours.length * 60,
                    borderRight: di < 6 ? '1px solid var(--border-light)' : 'none',
                    background: di >= 5 ? 'var(--table-header)' : 'transparent',
                    transition: 'background 0.35s',
                  }}
                >
                  {hours.map((_, hi) => (
                    <div key={hi} style={{ position: 'absolute', top: hi * 60, left: 0, right: 0, height: 1, background: 'var(--border-light)' }} />
                  ))}
                  {dc.map(c => {
                    const top = (getPos(c.time || '08:00') / 60) * 60;
                    const height = (getH(c.time || '08:00', c.endTime || '09:00') / 60) * 60;
                    const color = lvlC[c.level] || 'var(--text-4)';
                    return (
                      <div
                        key={c.id}
                        onMouseEnter={() => setTooltip(c.id)}
                        onMouseLeave={() => setTooltip(null)}
                        style={{
                          position: 'absolute',
                          top,
                          left: 4,
                          right: 4,
                          height: height - 4,
                          background: color + '18',
                          border: `1.5px solid ${color}40`,
                          borderLeft: `3px solid ${color}`,
                          borderRadius: 10,
                          padding: '6px 8px',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          fontSize: 11,
                          transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s',
                          transform: tooltip === c.id ? 'scale(1.03)' : 'scale(1)',
                          boxShadow: tooltip === c.id ? `0 4px 16px ${color}30` : 'none',
                          zIndex: tooltip === c.id ? 10 : 1,
                          animation: `scaleIn 0.35s cubic-bezier(0.16,1,0.3,1) ${di * 40}ms both`,
                        }}
                      >
                        <div style={{ fontWeight: 700, color, fontSize: 12, lineHeight: 1.2, marginBottom: 2 }}>{c.name}</div>
                        <div style={{ color: 'var(--text-3)', lineHeight: 1.3 }}>{c.teacher.split(' ').pop()}</div>
                        <div style={{ color: 'var(--text-4)' }}>
                          {c.room} · {c.students} HV
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16, padding: '0 4px' }}>
        {Object.entries(lvlC)
          .filter(([k]) => ['A1', 'A2', 'B1', 'B2'].includes(k))
          .map(([l, c]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)' }}>
              <div style={{ width: 12, height: 12, borderRadius: 4, background: c }} />
              {l}
            </div>
          ))}
      </div>
    </div>
  );
};

export default Schedule;
