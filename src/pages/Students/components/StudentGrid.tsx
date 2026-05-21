import React, { useState } from 'react';
import { Card, Avatar, StatusBadge, Icon } from '../../../components';
import { Student } from '../../../types/data';

interface StudentGridProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
  onEdit?: (student: Student) => void;
  onDelete?: (student: Student) => void;
}

const StudentCard: React.FC<{
  student: Student;
  index: number;
  onClick: () => void;
  onEdit?: (student: Student) => void;
  onDelete?: (student: Student) => void;
}> = ({ student, index, onClick, onEdit, onDelete }) => {
  const [hovered, setHovered] = useState(false);

  // Gradient based on Level
  const getLevelGradient = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'A1': return 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)'; // Emerald
      case 'A2': return 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.02) 100%)'; // Blue
      case 'B1': return 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.02) 100%)'; // Purple
      case 'B2': return 'linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, rgba(244, 63, 94, 0.02) 100%)'; // Rose
      default: return 'linear-gradient(135deg, rgba(107, 114, 128, 0.06) 0%, rgba(107, 114, 128, 0.01) 100%)';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'A1': return '#059669';
      case 'A2': return '#2563eb';
      case 'B1': return '#7c3aed';
      case 'B2': return '#e11d48';
      default: return 'var(--text-3)';
    }
  };

  return (
    <Card
      hover
      animate
      delay={index * 40}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        position: 'relative',
        background: getLevelGradient(student.level),
        border: hovered ? `1.5px solid ${getLevelColor(student.level)}` : '1.5px solid var(--border)',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? '0 12px 24px -10px rgba(0,0,0,0.08)' : 'var(--shadow)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        minHeight: 170,
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div style={{ position: 'relative' }}>
            <Avatar initials={student.avatar || student.name[0]} size={46} />
            <span
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                background: getLevelColor(student.level),
                color: '#fff',
                fontSize: 9,
                fontWeight: 800,
                padding: '2px 4px',
                borderRadius: 4,
                border: '2px solid var(--card)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                lineHeight: 1,
              }}
            >
              {student.level}
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 15, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {student.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                {student.age ? `${student.age} tuổi` : 'Chưa rõ tuổi'}
              </span>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border)' }} />
              <StatusBadge status={student.status} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--text-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="book" size={14} style={{ color: 'var(--text-4)' }} />
            <span style={{ fontWeight: 500, color: 'var(--text-2)' }}>{student.className || 'Chưa xếp lớp'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="user" size={14} style={{ color: 'var(--text-4)' }} />
            <span>Phụ huynh: <strong style={{ color: 'var(--text-1)' }}>{student.parent || '—'}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="phone" size={14} style={{ color: 'var(--text-4)' }} />
            <span style={{ fontFamily: 'monospace' }}>{student.phone || '—'}</span>
          </div>
          {student.attendanceRate !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="check" size={14} style={{ color: student.attendanceRate >= 80 ? '#10B981' : student.attendanceRate >= 50 ? '#F59E0B' : '#EF4444' }} />
              <span>
                Tỷ lệ đi học: <strong style={{ color: student.attendanceRate >= 80 ? '#10B981' : student.attendanceRate >= 50 ? '#F59E0B' : '#EF4444' }}>{Math.round(student.attendanceRate)}%</strong>
                {student.absenceCount !== undefined && student.absenceCount > 0 && ` (Vắng ${student.absenceCount})`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Hover Quick Actions Bar */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          display: 'flex',
          gap: 4,
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateX(0)' : 'translateX(8px)',
          transition: 'all 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {onEdit && (
          <button
            onClick={() => onEdit(student)}
            title="Chỉnh sửa"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: 'var(--info)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--info)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--card)';
              e.currentTarget.style.color = 'var(--info)';
            }}
          >
            <Icon name="edit" size={12} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(student)}
            title="Xoá học viên"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: 'var(--error)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--error)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--card)';
              e.currentTarget.style.color = 'var(--error)';
            }}
          >
            <Icon name="trash" size={12} />
          </button>
        )}
      </div>
    </Card>
  );
};

export const StudentGrid: React.FC<StudentGridProps> = ({ students, onSelectStudent, onEdit, onDelete }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
      {students.map((s, i) => (
        <StudentCard
          key={s.id}
          student={s}
          index={i}
          onClick={() => onSelectStudent(s)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
