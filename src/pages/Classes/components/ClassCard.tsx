import React, { useState } from 'react';
import { Card, Icon, Badge, Modal, InfoRow, StatusBadge, Button, ConfirmDialog } from '../../../components';
import { softDeleteClass } from '../../../services';
import type { Class } from '../../../types/data';

interface ClassCardProps {
  classData: Class;
  onEdit?: (c: Class) => void;
  onDelete?: () => void;
}

export const ClassCard: React.FC<ClassCardProps> = ({ classData, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const pct = Math.round((classData.students / classData.maxStudents) * 100);
  const barColor = pct > 85 ? '#EF4444' : pct > 60 ? '#F59E0B' : '#10B981';
  const lvlC: Record<string, string> = {
    'A1': '#FF6B35', 'A2': '#3B82F6', 'B1': '#10B981', 'B2': '#8B5CF6',
    'B2+': '#8B5CF6', 'A1-A2': '#F59E0B', 'All': '#EC4899',
  };

  const handleDelete = async () => {
    await softDeleteClass(String(classData.id));
    setConfirmDelete(false);
    setOpen(false);
    onDelete?.();
  };

  return (
    <>
      <Card hover animate onClick={() => setOpen(true)} style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
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
          <div style={{
            height: '100%', width: `${pct}%`, background: barColor,
            borderRadius: 3, transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
          }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="graduation" size={14} style={{ color: lvlC[classData.level] }} />
            {classData.teacher || 'Chưa phân công'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="calendar" size={14} />
            {classData.schedule || 'Chưa có lịch'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="building" size={14} />
            {classData.room || 'Chưa có phòng'} · {classData.fee || 'Miễn phí'}
          </div>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Chi tiết lớp học" width={580}>
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
            <InfoRow icon="graduation" label="Giáo viên" value={classData.teacher || '—'} />
            <InfoRow icon="calendar" label="Lịch học" value={classData.schedule || '—'} />
            <InfoRow icon="building" label="Phòng" value={classData.room || '—'} />
            <InfoRow icon="wallet" label="Học phí" value={classData.fee || 'Miễn phí'} />
            <InfoRow icon="users" label="Sĩ số" value={`${classData.students}/${classData.maxStudents}`} />
            <InfoRow icon="clock" label="Thời gian" value={`${classData.startDate || '?'} → ${classData.endDate || '?'}`} />
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <Button icon="edit" variant="outline" style={{ flex: 1 }}
              onClick={() => { setOpen(false); onEdit?.(classData); }}>
              Chỉnh sửa
            </Button>
            <Button icon="trash" variant="danger" style={{ flex: 1 }}
              onClick={() => setConfirmDelete(true)}>
              Xoá lớp
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Xoá lớp học"
        message={`Bạn có chắc muốn xoá lớp "${classData.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xoá lớp"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
};
