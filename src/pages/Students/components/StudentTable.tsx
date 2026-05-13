import React from 'react';
import { Card, Avatar, Badge, StatusBadge, Icon, EmptyState } from '../../../components';
import { Student } from '../../../types/data';

interface StudentTableProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
}

export const StudentTable: React.FC<StudentTableProps> = ({ students, onSelectStudent }) => {
  return (
    <Card animate delay={80} style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--table-header)', borderBottom: '1px solid var(--border)' }}>
              {['Học viên', 'Tuổi', 'Trình độ', 'Lớp', 'Phụ huynh', 'SĐT', 'Trạng thái', ''].map((h, i) => (
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
                      <div style={{ fontSize: 11, color: 'var(--text-4)' }}>#{String(s.id).padStart(3, '0')}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--text-2)' }}>{s.age}</td>
                <td style={{ padding: '12px 16px' }}>
                  <Badge variant="primary">{s.level}</Badge>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--text-2)' }}>{s.className}</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-2)' }}>{s.parent}</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{s.phone}</td>
                <td style={{ padding: '12px 16px' }}>
                  <StatusBadge status={s.status} />
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-4)',
                      padding: 4,
                    }}
                  >
                    <Icon name="more-v" size={16} />
                  </button>
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
