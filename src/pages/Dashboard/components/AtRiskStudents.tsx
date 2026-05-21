import React from 'react';
import { Card, Icon, Badge } from '../../../components';

interface AtRiskStudentsProps {
  students?: { id: string; name: string; className: string; absentCount: number }[];
}

export const AtRiskStudents: React.FC<AtRiskStudentsProps> = ({ students }) => {
  return (
    <Card animate delay={300} style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: 'var(--error-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--error)',
          }}
        >
          <Icon name="alert-circle" size={16} />
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>Học sinh vắng nhiều</span>
      </div>

      {!students || students.length === 0 ? (
        <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-3)' }}>
          <div style={{ background: 'var(--success-light)', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#10B981' }}>
            <Icon name="check" size={24} />
          </div>
          <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>Tuyệt vời!</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Không có học sinh nào vắng quá nhiều.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {students.map((student, index) => (
            <div key={`${student.id}-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--hover-bg)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                  {student.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{student.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{student.className}</div>
                </div>
              </div>
              <Badge variant="error" style={{ padding: '4px 8px' }}>
                Vắng {student.absentCount} buổi
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
