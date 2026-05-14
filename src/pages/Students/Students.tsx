import React, { useState } from 'react'
import { Card, Button, Input, Select, Tabs, LoadingSpinner, EmptyState, ConfirmDialog } from '../../components'
import { StudentTable } from './components/StudentTable'
import { StudentGrid } from './components/StudentGrid'
import { StudentDetail } from './components/StudentDetail'
import { StudentFormModal } from './components/StudentFormModal'
import { ImportStudentsModal } from './components/ImportStudentsModal'
import type { Student } from '../../types/data'
import { useQuery } from '../../hooks'
import { useCRUDPage, useListFilter, useEntityDelete } from '../../hooks'
import { getStudents, softDeleteStudent } from '../../services'
import { mapStudent } from '../../lib/mappers'
import { useAppContext } from '../../context/AppContext'

export const Students: React.FC = () => {
  const { selectedBranch, selectedYear } = useAppContext()
  const branchId = selectedBranch?.id
  const yearId = selectedYear?.id
  const { data: raw, loading, error, refetch } = useQuery(
    () => getStudents({ branchId, yearId }),
    [branchId, yearId]
  )
  const students: Student[] = (raw ?? []).map(mapStudent)

  const {
    state: { search, filters, viewMode, showForm, editItem: editStudent, deleteTarget, detailItem: selectedStudent },
    setSearch, setFilter, setViewMode,
    openAdd, openEdit, closeForm,
    setDetail, setDeleteTarget,
  } = useCRUDPage<Student>({ status: 'all', level: 'all' })

  const filtered = useListFilter(students, search, filters, {
    searchKeys: ['name', (s: Student) => s.parent ?? ''],
    filterMap: { status: 'status', level: 'level' },
  })

  const { handleDelete } = useEntityDelete<Student>({
    deleteFn: softDeleteStudent,
    refetch,
    entityLabel: 'học viên',
    getName: s => s.name,
    onSuccess: () => setDeleteTarget(null),
  })

  const activeCount = students.filter(s => s.status === 'active').length

  const [showImport, setShowImport] = useState(false)

  const importBtn = (
    <Button size="sm" variant="outline" icon="upload" onClick={() => setShowImport(true)}>
      Import
    </Button>
  )

  const viewTabs = (
    <Tabs
      tabs={[
        { id: 'table', label: '☰', tooltip: 'Dạng bảng' },
        { id: 'grid',  label: '⊞', tooltip: 'Dạng lưới' },
      ]}
      active={viewMode}
      onChange={v => setViewMode(v as 'table' | 'grid')}
    />
  )

  return (
    <div>
      {viewMode === 'grid' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>Quản lý học viên</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{`${students.length} học viên · ${activeCount} đang học`}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="outline" icon="upload" onClick={() => setShowImport(true)}>Import</Button>
            <Button icon="plus" onClick={openAdd}>Thêm học viên</Button>
          </div>
        </div>
      )}

      {viewMode === 'grid' && (
        <Card animate style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <Input placeholder="Tìm theo tên học viên, phụ huynh..." value={search} onChange={setSearch} icon="search" />
            </div>
            <Select value={filters.level} onChange={v => setFilter('level', v)}
              options={[
                { value: 'all', label: 'Tất cả trình độ' },
                { value: 'A1', label: 'A1 · Starter' },
                { value: 'A2', label: 'A2 · Elementary' },
                { value: 'B1', label: 'B1 · Pre-Inter' },
                { value: 'B2', label: 'B2 · Intermediate' },
              ]}
              style={{ minWidth: 160 }}
            />
            <Select value={filters.status} onChange={v => setFilter('status', v)}
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

      {error ? (
        <EmptyState title="Lỗi tải dữ liệu" desc={error.message} />
      ) : viewMode === 'table' ? (
        <StudentTable
          students={students}
          subtitle={`${students.length} học viên · ${activeCount} đang học`}
          onSelectStudent={setDetail}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          actions={<>{importBtn}{viewTabs}</>}
          onAdd={openAdd}
          onRefresh={refetch}
          loading={loading}
        />
      ) : loading ? (
        <LoadingSpinner />
      ) : (
        <StudentGrid students={filtered} onSelectStudent={setDetail} />
      )}

      <StudentDetail student={selectedStudent} onClose={() => setDetail(null)} onEdit={openEdit} onDelete={setDeleteTarget} />

      <StudentFormModal
        open={showForm}
        onClose={closeForm}
        onSuccess={refetch}
        student={editStudent}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xoá học viên"
        message={`Bạn có chắc muốn xoá học viên "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xoá"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />

      <ImportStudentsModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onSuccess={refetch}
        existingStudents={raw ?? []}
        branchId={branchId}
        yearId={yearId}
      />
    </div>
  )
}

export default Students
