import React, { useState } from 'react';
import { Card, Avatar, StatusBadge, Icon, Badge, Modal, InfoRow, Button, ConfirmDialog } from '../../../components';
import { softDeleteTeacher } from '../../../services';
import type { Teacher } from '../../../types/data';

interface TeacherCardProps {
  teacher: Teacher;
  onEdit?: (teacher: Teacher) => void;
  onDelete?: () => void;
}

export const TeacherCard: React.FC<TeacherCardProps> = ({ teacher, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    await softDeleteTeacher(String(teacher.id));
    setConfirmDelete(false);
    setOpen(false);
    onDelete?.();
  };

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
          <StatusBadge status={teacher.status} type="teacher" />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {teacher.subjects?.map((s: string) => (
            <Badge key={s} variant="info">{s}</Badge>
          ))}
          {(!teacher.subjects || teacher.subjects.length === 0) && (
            <span style={{ fontSize: 12, color: 'var(--text-4)' }}>Chưa có môn giảng dạy</span>
          )}
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          padding: '12px 0 0', borderTop: '1px solid var(--border-light)',
          fontSize: 13, color: 'var(--text-3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="phone" size={14} />
            {teacher.phone || '—'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <Icon name="mail" size={14} />
            {teacher.email || '—'}
          </div>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Thông tin giáo viên" width={520}>
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24,
            padding: 20, background: 'var(--hover-bg)', borderRadius: 14,
          }}>
            <Avatar initials={teacher.avatar || teacher.name[0]} size={56} color={teacher.color} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>{teacher.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{teacher.nationality}</div>
              {teacher.bio && <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 4 }}>{teacher.bio}</div>}
            </div>
            <StatusBadge status={teacher.status} type="teacher" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <InfoRow icon="phone" label="Điện thoại" value={teacher.phone || '—'} />
            <InfoRow icon="mail" label="Email" value={teacher.email || '—'} />
            <InfoRow icon="calendar" label="Ngày vào" value={teacher.joinDate || '—'} />
            <InfoRow icon="award" label="Chuyên môn" value={teacher.subjects?.join(', ') || '—'} />
            <InfoRow icon="building" label="Cơ sở" value={teacher.branches?.join(', ') || '—'} />
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <Button icon="edit" variant="outline" style={{ flex: 1 }}
              onClick={() => { setOpen(false); onEdit?.(teacher); }}>
              Chỉnh sửa
            </Button>
            <Button icon="trash" variant="danger" style={{ flex: 1 }}
              onClick={() => setConfirmDelete(true)}>
              Xoá
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Xoá giáo viên"
        message={`Bạn có chắc muốn xoá giáo viên "${teacher.name}"?`}
        confirmLabel="Xoá"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
};
