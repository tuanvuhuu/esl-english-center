import React from 'react';
import { Card, Avatar, Badge, StatusBadge, Icon, EmptyState } from '../../../components';
import type { Student } from '../../../types/data';

interface StudentTableProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
  onEdit?: (student: Student) => void;
  onDelete?: (student: Student) => void;
}

export const StudentTable: React.FC<StudentTableProps> = ({ students, onSelectStudent, onEdit, onDelete }) => {
  return (
    <Card animate delay={80} style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--table-header)', borderBottom: '1px solid var(--border)' }}>
              {['Học viên', 'Ngày sinh', 'Trình độ', 'Phụ huynh', 'SĐT', 'Trạng thái', ''].map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--text-3)',
                    whiteSpace: 'nowrap',
                    fontSize: 12,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s, idx) => (
              <tr
                key={s.id}
                onClick={() => onSelectStudent(s)}
                style={{
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  animation: `slideUp 0.3s ease ${idx * 30}ms both`,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--table-row-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar initials={s.avatar || s.name[0]} size={34} />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-4)' }}>
                        {s.enrollDate ? `Nhập học: ${s.enrollDate}` : `#${String(s.id).slice(0, 6)}`}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--text-2)' }}>{s.dob || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <Badge variant="primary">{s.level}</Badge>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--text-2)' }}>{s.parent || '—'}</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{s.phone || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <StatusBadge status={s.status} />
                </td>
                <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {onEdit && (
                      <button
                        onClick={() => onEdit(s)}
                        title="Chỉnh sửa"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 4, borderRadius: 6 }}
                      >
                        <Icon name="edit" size={15} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(s)}
                        title="Xoá"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: 4, borderRadius: 6 }}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {students.length === 0 && <EmptyState icon="users" title="Không tìm thấy học viên" desc="Thử thay đổi bộ lọc" />}
    </Card>
  );
};
