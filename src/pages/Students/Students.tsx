import React, { useState } from 'react';
import { Card, Button, PageHeader, Input, Select, Tabs, LoadingSpinner, EmptyState, ConfirmDialog } from '../../components';
import { StudentTable } from './components/StudentTable';
import { StudentGrid } from './components/StudentGrid';
import { StudentDetail } from './components/StudentDetail';
import { StudentFormModal } from './components/StudentFormModal';
import type { Student } from '../../types/data';
import { useQuery } from '../../hooks';
import { getStudents, softDeleteStudent } from '../../services';
import { mapStudent } from '../../lib/mappers';

export const Students: React.FC = () => {
  const { data: raw, loading, error, refetch } = useQuery(getStudents);
  const students: Student[] = (raw ?? []).map(mapStudent);

  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewMode, setViewMode] = useState('table');

  const filtered = students.filter(s => {
    const ms = s.name.toLowerCase().includes(search.toLowerCase()) ||
               (s.parent ?? '').toLowerCase().includes(search.toLowerCase());
    const ml = filterLevel === 'all' || s.level === filterLevel;
    const mt = filterStatus === 'all' || s.status === filterStatus;
    return ms && ml && mt;
  });

  const activeCount = students.filter(s => s.status === 'active').length;

  const handleEdit = (student: Student) => {
    setEditStudent(student);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await softDeleteStudent(String(deleteTarget.id));
    setDeleteTarget(null);
    refetch();
  };

  const viewTabs = (
    <Tabs tabs={[{ id: 'table', label: '☰' }, { id: 'grid', label: '⊞' }]} active={viewMode} onChange={setViewMode} />
  );

  return (
    <div>
      <PageHeader
        title="Quản lý học viên"
        subtitle={`${students.length} học viên · ${activeCount} đang học`}
        actions={viewMode === 'grid' ? <Button icon="plus" onClick={() => { setEditStudent(null); setShowForm(true); }}>Thêm học viên</Button> : undefined}
      />

      {viewMode === 'grid' && (
        <Card animate style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <Input placeholder="Tìm theo tên học viên, phụ huynh..." value={search} onChange={setSearch} icon="search" />
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
            {viewTabs}
          </div>
        </Card>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <EmptyState title="Lỗi tải dữ liệu" desc={error.message} />
      ) : viewMode === 'table' ? (
        <StudentTable
          students={students}
          subtitle={`${students.length} học viên · ${activeCount} đang học`}
          onSelectStudent={setSelectedStudent}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          actions={viewTabs}
          onAdd={() => { setEditStudent(null); setShowForm(true); }}
          onRefresh={refetch}
        />
      ) : (
        <StudentGrid students={filtered} onSelectStudent={setSelectedStudent} />
      )}

      <StudentDetail student={selectedStudent} onClose={() => setSelectedStudent(null)} />

      <StudentFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditStudent(null); }}
        onSuccess={refetch}
        student={editStudent}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xoá học viên"
        message={`Bạn có chắc muốn xoá học viên "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xoá"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Students;
