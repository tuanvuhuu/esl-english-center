import React from 'react';
import { PageHeader, Button } from '../../components';
import { TEACHERS_DATA } from '../../data';
import { TeacherCard } from './components/TeacherCard';

export const Teachers: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Quản lý giáo viên"
        subtitle={`${TEACHERS_DATA.length} giáo viên`}
        actions={<Button icon="plus">Thêm giáo viên</Button>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {TEACHERS_DATA.map((t, i) => (
          <div key={t.id} style={{ animation: `fadeIn 0.5s ease ${i * 80}ms both` }}>
            <TeacherCard teacher={t} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Teachers;
