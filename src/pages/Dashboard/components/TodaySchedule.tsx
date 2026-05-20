import React from 'react';
import { Card, Icon, Badge, FadeIn } from '../../../components';

interface ScheduleItem {
  id: string;
  time: string;
  name: string;
  teacher: string;
  room: string;
  students: number;
  level: string;
  active: boolean;
}

interface TodayScheduleProps {
  classes?: ScheduleItem[];
  loading?: boolean;
  onQuickAttendance?: (classId: string) => void;
}

export const TodaySchedule: React.FC<TodayScheduleProps> = ({ classes = [], loading = false, onQuickAttendance }) => {
  const lvl: Record<string, string> = { 
    A1: '#FF6B35', A2: '#3B82F6', B1: '#10B981', B2: '#8B5CF6',
    Starters: '#FF6B35', Movers: '#3B82F6', Flyers: '#10B981', KET: '#8B5CF6', PET: '#F59E0B'
  };

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
        <Badge variant="primary">{classes.length} lớp</Badge>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>
            Đang tải lịch học...
          </div>
        ) : classes.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>
            Không có lớp học nào hôm nay
          </div>
        ) : (
          classes.map((c, i) => (
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
              <div style={{ width: 4, height: 36, borderRadius: 2, background: lvl[c.level] || 'var(--primary)' }} />
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
              <div style={{ textAlign: 'right', flexShrink: 0, marginRight: c.active ? 8 : 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{c.time.split(' - ')[0]}</div>
                <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{c.time.split(' - ')[1]}</div>
              </div>
              {c.active && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickAttendance?.(c.id);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      background: 'var(--primary)',
                      color: '#fff',
                      border: 'none',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    Điểm danh
                  </button>
                  <Badge variant="success" style={{ fontSize: 10, animation: 'pulse 2s ease infinite' }}>
                    LIVE
                  </Badge>
                </div>
              )}
            </FadeIn>
          ))
        )}
      </div>
    </Card>
  );
};
