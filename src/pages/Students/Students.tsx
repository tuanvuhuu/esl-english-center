import React, { useState } from 'react';
import { Card, Button, PageHeader, Input, Select, Tabs } from '../../components';
import { STUDENTS_DATA } from '../../data';
import { StudentTable } from './components/StudentTable';
import { StudentGrid } from './components/StudentGrid';
import { StudentDetail } from './components/StudentDetail';
import { AddStudentModal } from './components/AddStudentModal';
import { Student } from '../../types/data';

export const Students: React.FC = () => {
  const [students] = useState<Student[]>(STUDENTS_DATA);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewMode, setViewMode] = useState('table');

  const filtered = students.filter(s => {
    const ms =
      s.name.toLowerCase().includes(search.toLowerCase()) || s.parent.toLowerCase().includes(search.toLowerCase());
    const ml = filterLevel === 'all' || s.level === filterLevel;
    const mt = filterStatus === 'all' || s.status === filterStatus;
    return ms && ml && mt;
  });

  const counts = {
    all: students.length,
    active: students.filter(s => s.status === 'active').length,
  };

  return (
    <div>
      <PageHeader
        title="Quản lý học viên"
        subtitle={`${students.length} học viên · ${counts.active} đang học`}
        actions={<Button icon="plus" onClick={() => setShowAdd(true)}>Thêm học viên</Button>}
      />

      <Card animate style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Input
              placeholder="Tìm theo tên học viên, phụ huynh..."
              value={search}
              onChange={setSearch}
              icon="search"
            />
          </div>
          <Select
            value={filterLevel}
            onChange={setFilterLevel}
            options={[
              { value: 'all', label: 'Tất cả trình độ' },
              { value: 'A1', label: 'A1 · Starter' },
              { value: 'A2', label: 'A2 · Elementary' },
              { value: 'B1', label: 'B1 · Pre-Inter' },
              { value: 'B2', label: 'B2 · Intermediate' },
            ]}
            style={{ minWidth: 160 }}
          />
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'active', label: 'Đang học' },
              { value: 'trial', label: 'Học thử' },
              { value: 'paused', label: 'Tạm nghỉ' },
            ]}
            style={{ minWidth: 160 }}
          />
          <Tabs
            tabs={[
              { id: 'table', label: '☰' },
              { id: 'grid', label: '⊞' },
            ]}
            active={viewMode}
            onChange={setViewMode}
          />
        </div>
      </Card>

      {viewMode === 'table' ? (
        <StudentTable students={filtered} onSelectStudent={setSelectedStudent} />
      ) : (
        <StudentGrid students={filtered} onSelectStudent={setSelectedStudent} />
      )}

      <StudentDetail student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      <AddStudentModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
};

export default Students;
