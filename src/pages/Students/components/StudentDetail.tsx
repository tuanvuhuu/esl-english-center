import React from 'react';
import { Modal, Avatar, StatusBadge, InfoRow, Button } from '../../../components';
import { Student } from '../../../types/data';

interface StudentDetailProps {
  student: Student | null;
  onClose: () => void;
  onEdit?: (student: Student) => void;
  onDelete?: (student: Student) => void;
}

export const StudentDetail: React.FC<StudentDetailProps> = ({ student, onClose, onEdit, onDelete }) => {
  return (
    <Modal open={!!student} onClose={onClose} title="Thông tin học viên" width={560}>
      {student && (
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
              transition: 'background 0.35s',
            }}
          >
            <Avatar initials={student.avatar || student.name[0]} size={56} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>{student.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
                {student.age} tuổi · {student.gender === 'F' ? 'Nữ' : 'Nam'} · Ngày sinh: {student.dob}
              </div>
            </div>
            <StatusBadge status={student.status} />
          </div>

          <div style={{ marginBottom: 20, padding: 16, background: 'var(--hover-bg)', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>Tiến độ khoá học</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>68%</span>
            </div>
            <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: '68%',
                  background: 'linear-gradient(90deg, var(--primary), #FF8F65)',
                  borderRadius: 4,
                  transition: 'width 0.8s ease',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-4)' }}>
              <span>Bắt đầu: {student.enrollDate}</span>
              <span>Dự kiến: 30/06/2026</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <InfoRow icon="book" label="Lớp" value={student.className} />
            <InfoRow icon="award" label="Trình độ" value={student.level} />
            <InfoRow icon="user" label="Phụ huynh" value={student.parent} />
            <InfoRow icon="phone" label="Điện thoại" value={student.phone} />
            <InfoRow icon="mail" label="Email" value={student.email} />
            <InfoRow icon="calendar" label="Ngày nhập học" value={student.enrollDate} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)', justifyContent: 'center' }}>
            <Button icon="edit"    variant="outline"    onClick={() => { onEdit?.(student); onClose(); }}>Chỉnh sửa</Button>
            <Button icon="message" variant="secondary"  >Nhắn tin</Button>
            <Button icon="trash"   variant="danger"     onClick={() => { onDelete?.(student); onClose(); }}>Xoá</Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
