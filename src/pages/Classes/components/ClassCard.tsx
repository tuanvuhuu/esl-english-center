import React, { useState } from 'react';
import { Card, Icon, Badge, Modal, InfoRow, Avatar, StatusBadge } from '../../../components';
import { STUDENTS_DATA } from '../../../data';
import { Class } from '../../../types/data';

interface ClassCardProps {
  classData: Class;
}

export const ClassCard: React.FC<ClassCardProps> = ({ classData }) => {
  const [open, setOpen] = useState(false);
  const pct = Math.round((classData.students / classData.maxStudents) * 100);
  const barColor = pct > 85 ? '#EF4444' : pct > 60 ? '#F59E0B' : '#10B981';
  const lvlC: Record<string, string> = { 
    'A1': '#FF6B35', 'A2': '#3B82F6', 'B1': '#10B981', 'B2': '#8B5CF6', 
    'B2+': '#8B5CF6', 'A1-A2': '#F59E0B', 'All': '#EC4899' 
  };
  const classStudents = STUDENTS_DATA.filter(s => s.className === classData.name);

  return (
    <>
      <Card
        hover
        animate
        onClick={() => setOpen(true)}
        style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: lvlC[classData.level] || 'var(--text-4)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>{classData.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              {classData.ageGroup || 'N/A'} tuổi · {classData.level}
            </div>
          </div>
          <Badge variant={pct > 85 ? 'error' : pct > 60 ? 'warning' : 'success'}>
            {classData.students}/{classData.maxStudents}
          </Badge>
        </div>
        <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, marginBottom: 14, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: barColor,
              borderRadius: 3,
              transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="graduation" size={14} style={{ color: lvlC[classData.level] }} />
            {classData.teacher}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="calendar" size={14} />
            {classData.schedule}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="building" size={14} />
            {classData.room} · {classData.fee || 'Miễn phí'}
          </div>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Chi tiết lớp học" width={600}>
        <div>
          <div style={{ padding: 20, background: 'var(--hover-bg)', borderRadius: 14, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)' }}>{classData.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
                  {classData.level} · {classData.ageGroup || 'N/A'} tuổi
                </div>
              </div>
              <StatusBadge status={classData.status} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <InfoRow icon="graduation" label="Giáo viên" value={classData.teacher} />
            <InfoRow icon="calendar" label="Lịch học" value={classData.schedule} />
            <InfoRow icon="building" label="Phòng" value={classData.room} />
            <InfoRow icon="wallet" label="Học phí" value={classData.fee || 'Miễn phí'} />
            <InfoRow icon="users" label="Sĩ số" value={`${classData.students}/${classData.maxStudents}`} />
            <InfoRow icon="clock" label="Thời gian" value={`${classData.startDate || ''} → ${classData.endDate || ''}`} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)', marginBottom: 10 }}>Danh sách học viên</div>
            {classStudents.map(s => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  background: 'var(--hover-bg)',
                  borderRadius: 10,
                  marginBottom: 4,
                  transition: 'background 0.35s',
                }}
              >
                <Avatar initials={s.avatar || s.name[0]} size={30} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{s.name}</span>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.age} tuổi</span>
                <StatusBadge status={s.status} />
              </div>
            ))}
            {classStudents.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-4)', fontSize: 13 }}>
                Chưa có học viên nào trong lớp này
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};
