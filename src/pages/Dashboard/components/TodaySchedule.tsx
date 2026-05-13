import React from 'react';
import { Card, Icon, Badge, FadeIn } from '../../../components';

interface ScheduleItem {
  time: string;
  name: string;
  teacher: string;
  room: string;
  students: number;
  level: string;
  active: boolean;
}

export const TodaySchedule: React.FC = () => {
  const todayClasses: ScheduleItem[] = [
    { time: '15:00 - 16:30', name: 'Kids Starter A', teacher: 'Ms. Sarah', room: 'P.201', students: 12, level: 'A1', active: false },
    { time: '17:00 - 18:30', name: 'Kids Elementary A', teacher: 'Ms. Sarah', room: 'P.201', students: 14, level: 'A2', active: true },
    { time: '17:00 - 18:30', name: 'Kids Elementary B', teacher: 'Ms. Emily', room: 'P.203', students: 11, level: 'A2', active: true },
    { time: '17:30 - 19:00', name: 'Teen Pre-Inter A', teacher: 'Mr. James', room: 'P.301', students: 15, level: 'B1', active: false },
    { time: '18:00 - 19:30', name: 'Teen Inter A', teacher: 'Mr. James', room: 'P.302', students: 8, level: 'B2', active: false },
  ];
  
  const lvl: Record<string, string> = { A1: '#FF6B35', A2: '#3B82F6', B1: '#10B981', B2: '#8B5CF6' };

  return (
    <Card animate delay={150} style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <Icon name="calendar" size={16} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>Lịch hôm nay</span>
        </div>
        <Badge variant="primary">{todayClasses.length} lớp</Badge>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {todayClasses.map((c, i) => (
          <FadeIn
            key={i}
            delay={i * 80}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              background: c.active ? 'var(--activity-warm)' : 'var(--hover-bg)',
              borderRadius: 12,
              border: c.active ? '1.5px solid var(--primary)' : '1px solid var(--border-light)',
              transition: 'all 0.25s',
              cursor: 'pointer',
            }}
          >
            <div style={{ width: 4, height: 36, borderRadius: 2, background: lvl[c.level] || 'var(--text-4)' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{c.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                <span>{c.teacher}</span>
                <span>·</span>
                <span>{c.room}</span>
                <span>·</span>
                <span>{c.students} HV</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{c.time.split(' - ')[0]}</div>
              <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{c.time.split(' - ')[1]}</div>
            </div>
            {c.active && (
              <Badge variant="success" style={{ fontSize: 10, animation: 'pulse 2s ease infinite' }}>
                LIVE
              </Badge>
            )}
          </FadeIn>
        ))}
      </div>
    </Card>
  );
};
