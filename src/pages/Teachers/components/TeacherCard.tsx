import React, { useState } from 'react';
import { Card, Avatar, StatusBadge, Icon, Badge, Modal, InfoRow, Button } from '../../../components';
import { CLASSES_DATA } from '../../../data';
import { Teacher } from '../../../types/data';

interface TeacherCardProps {
  teacher: Teacher;
}

export const TeacherCard: React.FC<TeacherCardProps> = ({ teacher }) => {
  const [open, setOpen] = useState(false);
  const teacherClasses = CLASSES_DATA.filter(c => c.teacherId === teacher.id);

  return (
    <>
      <Card hover animate style={{ cursor: 'pointer' }} onClick={() => setOpen(true)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <Avatar initials={teacher.avatar || teacher.name[0]} size={48} color={teacher.color} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>{teacher.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <Icon name="map-pin" size={12} />
              {teacher.nationality}
            </div>
          </div>
          <StatusBadge status={teacher.status} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {teacher.subjects && teacher.subjects.map((s: string) => (
            <Badge key={s} variant="info">
              {s}
            </Badge>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px 0 0',
            borderTop: '1px solid var(--border-light)',
            fontSize: 13,
            color: 'var(--text-3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="book" size={14} />
            {teacher.classCount} lớp
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <Icon name="mail" size={14} />
            {teacher.email}
          </div>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Thông tin giáo viên" width={520}>
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 24,
              padding: 20,
              background: 'var(--hover-bg)',
              borderRadius: 14,
            }}
          >
            <Avatar initials={teacher.avatar || teacher.name[0]} size={56} color={teacher.color} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>{teacher.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{teacher.nationality}</div>
            </div>
            <StatusBadge status={teacher.status} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <InfoRow icon="phone" label="Điện thoại" value={teacher.phone} />
            <InfoRow icon="mail" label="Email" value={teacher.email} />
            <InfoRow icon="book" label="Số lớp dạy" value={`${teacher.classCount} lớp`} />
            <InfoRow icon="award" label="Chuyên môn" value={teacher.subjects ? teacher.subjects.join(', ') : ''} />
          </div>
          <div style={{ marginTop: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)', marginBottom: 10 }}>Lớp đang dạy</div>
            {teacherClasses.map(c => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  background: 'var(--hover-bg)',
                  borderRadius: 10,
                  marginBottom: 6,
                  transition: 'background 0.35s',
                }}
              >
                <div style={{ width: 4, height: 28, borderRadius: 2, background: teacher.color }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{c.schedule}</div>
                </div>
                <Badge>{c.room}</Badge>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <Button icon="edit" variant="outline" style={{ flex: 1 }}>
              Chỉnh sửa
            </Button>
            <Button icon="calendar" variant="secondary" style={{ flex: 1 }}>
              Xem lịch dạy
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
