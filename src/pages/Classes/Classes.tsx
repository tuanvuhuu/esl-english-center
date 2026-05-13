import React, { useState } from 'react';
import { PageHeader, Button, FadeIn } from '../../components';
import { CLASSES_DATA } from '../../data';
import { ClassCard } from './components/ClassCard';

export const Classes: React.FC = () => {
  const [filterLevel, setFilterLevel] = useState('all');

  const filtered = CLASSES_DATA.filter(c => filterLevel === 'all' || c.level === filterLevel);

  return (
    <div>
      <PageHeader
        title="Quản lý lớp học"
        subtitle={`${CLASSES_DATA.length} lớp · ${CLASSES_DATA.reduce((a, c) => a + c.students, 0)} học viên`}
        actions={<Button icon="plus">Mở lớp mới</Button>}
      />

      <FadeIn delay={0}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {[
            { v: 'all', l: 'Tất cả' },
            { v: 'A1', l: 'A1' },
            { v: 'A2', l: 'A2' },
            { v: 'B1', l: 'B1' },
            { v: 'B2', l: 'B2' },
          ].map(f => (
            <button
              key={f.v}
              onClick={() => setFilterLevel(f.v)}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'var(--font)',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                background: filterLevel === f.v ? 'var(--primary)' : 'var(--hover-bg)',
                color: filterLevel === f.v ? '#fff' : 'var(--text-3)',
                transform: filterLevel === f.v ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {f.l}
            </button>
          ))}
        </div>
      </FadeIn>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {filtered.map((c, i) => (
          <div key={c.id} style={{ animation: `fadeIn 0.5s ease ${i * 80}ms both` }}>
            <ClassCard classData={c} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Classes;
