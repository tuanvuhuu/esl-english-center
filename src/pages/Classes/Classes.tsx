import React, { useState } from 'react';
import { PageHeader, Button, FadeIn, LoadingSpinner, EmptyState } from '../../components';
import { ClassCard } from './components/ClassCard';
import { ClassFormModal } from './components/ClassFormModal';
import { useQuery } from '../../hooks';
import { getClasses } from '../../services';
import { mapClass } from '../../lib/mappers';
import type { Class } from '../../types/data';

export const Classes: React.FC = () => {
  const { data: raw, loading, error, refetch } = useQuery(getClasses);
  const classes = (raw ?? []).map(mapClass);

  const [filterLevel, setFilterLevel] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editClass, setEditClass] = useState<Class | null>(null);

  const filtered = classes.filter(c => filterLevel === 'all' || c.level === filterLevel);
  const totalStudents = classes.reduce((a, c) => a + c.students, 0);

  const handleEdit = (c: Class) => {
    setEditClass(c);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditClass(null);
  };

  return (
    <div>
      <PageHeader
        title="Quản lý lớp học"
        subtitle={`${classes.length} lớp · ${totalStudents} học viên`}
        actions={
          <Button icon="plus" onClick={() => { setEditClass(null); setShowForm(true); }}>
            Mở lớp mới
          </Button>
        }
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
                padding: '8px 16px', borderRadius: 10, border: 'none',
                fontSize: 13, fontWeight: 600, fontFamily: 'var(--font)', cursor: 'pointer',
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

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <EmptyState title="Lỗi tải dữ liệu" desc={error.message} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map((c, i) => (
            <div key={c.id} style={{ animation: `fadeIn 0.5s ease ${i * 80}ms both` }}>
              <ClassCard classData={c} onEdit={handleEdit} onDelete={refetch} />
            </div>
          ))}
        </div>
      )}

      <ClassFormModal
        open={showForm}
        onClose={handleFormClose}
        onSuccess={refetch}
        classData={editClass}
      />
    </div>
  );
};

export default Classes;
