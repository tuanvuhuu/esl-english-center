import React, { useState } from 'react';
import { PageHeader, Button, Card, Select, Badge, StatusBadge, Avatar, Icon } from '../../components';
import { CLASSES_DATA, STUDENTS_DATA } from '../../data';

type AttendanceStatus = 'present' | 'absent';

export const Attendance: React.FC = () => {
  const [selClass, setSelClass] = useState(CLASSES_DATA[0].name);
  const [att, setAtt] = useState<Record<string | number, AttendanceStatus>>(() => {
    const m: Record<string | number, AttendanceStatus> = {};
    STUDENTS_DATA.forEach(s => {
      m[s.id] = Math.random() > 0.15 ? 'present' : 'absent';
    });
    return m;
  });

  const classStudents = STUDENTS_DATA.filter(s => s.className === selClass);
  const toggle = (id: string | number) => 
    setAtt(p => ({ ...p, [id]: p[id] === 'present' ? 'absent' : 'present' } as Record<string | number, AttendanceStatus>));
  
  const pCount = classStudents.filter(s => att[s.id] === 'present').length;

  return (
    <div>
      <PageHeader 
        title="Điểm danh" 
        subtitle="Thứ Ba, 13/05/2026" 
        actions={<Button icon="check">Lưu điểm danh</Button>} 
      />

      <Card animate style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Select
            value={selClass}
            onChange={setSelClass}
            options={CLASSES_DATA.map(c => ({ value: c.name, label: c.name }))}
            style={{ minWidth: 200 }}
          />
          <Badge variant="success">
            {pCount}/{classStudents.length} có mặt
          </Badge>
          <Badge variant="error">{classStudents.length - pCount} vắng</Badge>
        </div>
      </Card>

      <Card animate delay={60} style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--table-header)', borderBottom: '1px solid var(--border)' }}>
              {['#', 'Học viên', 'Tuổi', 'Trạng thái', 'Điểm danh'].map((h, i) => (
                <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-3)', fontSize: 12 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classStudents.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border-light)', animation: `slideUp 0.3s ease ${i * 30}ms both` }}>
                <td style={{ padding: '10px 16px', color: 'var(--text-4)' }}>{i + 1}</td>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar initials={s.avatar || s.name[0]} size={32} />
                    <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{s.name}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 16px', color: 'var(--text-3)' }}>{s.age}</td>
                <td style={{ padding: '10px 16px' }}>
                  <StatusBadge status={s.status} />
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <button
                    onClick={() => toggle(s.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 14px',
                      borderRadius: 10,
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font)',
                      fontSize: 13,
                      fontWeight: 600,
                      background: att[s.id] === 'present' ? 'var(--success-light)' : 'var(--error-light)',
                      color: att[s.id] === 'present' ? 'var(--success-dark)' : 'var(--error-dark)',
                      transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                      transform: 'scale(1)',
                    }}
                    onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.93)')}
                    onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <Icon name={att[s.id] === 'present' ? 'check' : 'x'} size={14} />
                    {att[s.id] === 'present' ? 'Có mặt' : 'Vắng'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default Attendance;
