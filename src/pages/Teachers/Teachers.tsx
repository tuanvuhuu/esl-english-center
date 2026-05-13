import React, { useState } from 'react';
import { PageHeader, Button, LoadingSpinner, EmptyState } from '../../components';
import { TeacherCard } from './components/TeacherCard';
import { TeacherFormModal } from './components/TeacherFormModal';
import { useQuery } from '../../hooks';
import { getTeachers } from '../../services';
import { mapTeacher } from '../../lib/mappers';
import type { Teacher } from '../../types/data';

export const Teachers: React.FC = () => {
  const { data: raw, loading, error, refetch } = useQuery(getTeachers);
  const teachers = (raw ?? []).map(mapTeacher);

  const [showForm, setShowForm] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);

  const handleEdit = (teacher: Teacher) => {
    setEditTeacher(teacher);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditTeacher(null);
  };

  return (
    <div>
      <PageHeader
        title="Quản lý giáo viên"
        subtitle={`${teachers.length} giáo viên`}
        actions={
          <Button icon="plus" onClick={() => { setEditTeacher(null); setShowForm(true); }}>
            Thêm giáo viên
          </Button>
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <EmptyState title="Lỗi tải dữ liệu" desc={error.message} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {teachers.map((t, i) => (
            <div key={t.id} style={{ animation: `fadeIn 0.5s ease ${i * 80}ms both` }}>
              <TeacherCard teacher={t} onEdit={handleEdit} onDelete={refetch} />
            </div>
          ))}
        </div>
      )}

      <TeacherFormModal
        open={showForm}
        onClose={handleFormClose}
        onSuccess={refetch}
        teacher={editTeacher}
      />
    </div>
  );
};

export default Teachers;
