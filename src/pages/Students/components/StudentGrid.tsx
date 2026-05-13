import React from 'react';
import { Card, Avatar, StatusBadge, Icon } from '../../../components';
import { Student } from '../../../types/data';

interface StudentGridProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
}

export const StudentGrid: React.FC<StudentGridProps> = ({ students, onSelectStudent }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
      {students.map((s, i) => (
        <Card
          key={s.id}
          hover
          animate
          delay={i * 50}
          onClick={() => onSelectStudent(s)}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <Avatar initials={s.avatar || s.name[0]} size={44} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 14 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                {s.age} tuổi · {s.level}
              </div>
            </div>
            <StatusBadge status={s.status} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="book" size={14} />
              {s.className}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="user" size={14} />
              {s.parent}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="phone" size={14} />
              {s.phone}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
