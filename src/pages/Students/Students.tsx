import React, { useState, useEffect } from 'react'
import { Button, Tabs, LoadingSpinner, EmptyState, ConfirmDialog } from '../../components'
import { StudentTable } from './components/StudentTable'
import { StudentGrid } from './components/StudentGrid'
import { StudentDetail } from './components/StudentDetail'
import { StudentFormModal } from './components/StudentFormModal'
import { ImportStudentsModal } from './components/ImportStudentsModal'
import type { Student } from '../../types/data'
import { useQuery } from '../../hooks'
import { useCRUDPage, useListFilter, useEntityDelete } from '../../hooks'
import { getStudents, softDeleteStudent, bulkSoftDeleteStudents } from '../../services'
import { mapStudent } from '../../lib/mappers'
import { useAppContext } from '../../context/AppContext'

interface StudentsProps {
  params?: {
    search?: string;
    studentId?: string;
    tab?: 'info' | 'history';
  };
  onNavigate?: (page: string, params?: any) => void;
}

export const Students: React.FC<StudentsProps> = ({ params, onNavigate }) => {
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

  useEffect(() => {
    if (params?.search) {
      setSearch(params.search)
    }
  }, [params?.search, setSearch])

  useEffect(() => {
    if ((params?.studentId || params?.search) && students.length) {
      const match = students.find(s => String(s.id) === String(params.studentId)) ||
                    students.find(s => s.name.toLowerCase() === String(params.search || '').toLowerCase());
      if (match) {
        setDetail(match)
      }
    }
  }, [params?.studentId, params?.search, students, setDetail])

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

  const statusCounts = {
    active: students.filter(s => s.status === 'active').length,
    trial: students.filter(s => s.status === 'trial').length,
    paused: students.filter(s => s.status === 'paused').length,
    inactive: students.filter(s => s.status === 'inactive').length,
  };
  const [showImport, setShowImport] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([])

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

  const statusSummary = (
    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--hover-bg)', padding: '2px', borderRadius: 8, border: '1px solid var(--border)', gap: 2 }}>
      <button
        onClick={() => setFilter('status', 'all')}
        style={{
          border: 'none',
          background: filters.status === 'all' ? 'var(--card)' : 'transparent',
          color: filters.status === 'all' ? 'var(--primary)' : 'var(--text-2)',
          fontWeight: filters.status === 'all' ? 700 : 500,
          fontSize: 11,
          padding: '4px 10px',
          borderRadius: 6,
          cursor: 'pointer',
          transition: 'all 0.15s',
          boxShadow: filters.status === 'all' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
        }}
      >
        Tất cả ({students.length})
      </button>
      <button
        onClick={() => setFilter('status', 'active')}
        style={{
          border: 'none',
          background: filters.status === 'active' ? 'var(--card)' : 'transparent',
          color: filters.status === 'active' ? '#10B981' : 'var(--text-2)',
          fontWeight: filters.status === 'active' ? 700 : 500,
          fontSize: 11,
          padding: '4px 10px',
          borderRadius: 6,
          cursor: 'pointer',
          transition: 'all 0.15s',
          boxShadow: filters.status === 'active' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
        Đang học ({statusCounts.active})
      </button>
      <button
        onClick={() => setFilter('status', 'trial')}
        style={{
          border: 'none',
          background: filters.status === 'trial' ? 'var(--card)' : 'transparent',
          color: filters.status === 'trial' ? '#3B82F6' : 'var(--text-2)',
          fontWeight: filters.status === 'trial' ? 700 : 500,
          fontSize: 11,
          padding: '4px 10px',
          borderRadius: 6,
          cursor: 'pointer',
          transition: 'all 0.15s',
          boxShadow: filters.status === 'trial' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B82F6' }} />
        Học thử ({statusCounts.trial})
      </button>
      <button
        onClick={() => setFilter('status', 'paused')}
        style={{
          border: 'none',
          background: filters.status === 'paused' ? 'var(--card)' : 'transparent',
          color: filters.status === 'paused' ? '#F59E0B' : 'var(--text-2)',
          fontWeight: filters.status === 'paused' ? 700 : 500,
          fontSize: 11,
          padding: '4px 10px',
          borderRadius: 6,
          cursor: 'pointer',
          transition: 'all 0.15s',
          boxShadow: filters.status === 'paused' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B' }} />
        Tạm nghỉ ({statusCounts.paused})
      </button>
      {statusCounts.inactive > 0 && (
        <button
          onClick={() => setFilter('status', 'inactive')}
          style={{
            border: 'none',
            background: filters.status === 'inactive' ? 'var(--card)' : 'transparent',
            color: filters.status === 'inactive' ? '#EF4444' : 'var(--text-2)',
            fontWeight: filters.status === 'inactive' ? 700 : 500,
            fontSize: 11,
            padding: '4px 10px',
            borderRadius: 6,
            cursor: 'pointer',
            transition: 'all 0.15s',
            boxShadow: filters.status === 'inactive' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444' }} />
          Nghỉ học ({statusCounts.inactive})
        </button>
      )}
    </div>
  )

  const renderTableActions = () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {selectedStudents.length > 0 && (
        <Button
          size="sm"
          variant="outline"
          icon="trash"
          onClick={() => {
            if (confirm(`Xoá ${selectedStudents.length} học viên?`)) {
              bulkSoftDeleteStudents(selectedStudents.map(s => String(s.id)))
                .then(() => {
                  setSelectedStudents([])
                  refetch()
                })
                .catch((err) => {
                  console.error('Bulk delete failed:', err)
                })
            }
          }}
        >
          Xoá
        </Button>
      )}
      {statusSummary}
      <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 2px' }} />
      {viewTabs}
      <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 2px' }} />
      <Button
        size="sm"
        variant="outline"
        icon="upload"
        onClick={() => setShowImport(true)}
      >
        Import
      </Button>
    </div>
  )

  return (
    <div>
      {/* Grid view only header, in table view DataGrid's own card header is used */}
      {viewMode === 'grid' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>Quản lý học viên</h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '4px 0 0' }}>{`${students.length} học viên · ${statusCounts.active} đang học`}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {statusSummary}
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
            {viewTabs}
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
            <Button variant="outline" icon="upload" onClick={() => setShowImport(true)} style={{ height: 32 }}>Import</Button>
            <Button icon="plus" onClick={openAdd} style={{ height: 32 }}>Thêm học viên</Button>
          </div>
        </div>
      )}

      {error ? (
        <EmptyState title="Lỗi tải dữ liệu" desc={error.message} />
      ) : viewMode === 'table' ? (
        <div style={{ position: 'relative' }}>
          <StudentTable
            title="Quản lý học viên"
            subtitle={`${students.length} học viên · ${statusCounts.active} đang học`}
            students={filtered}
            onSelectStudent={setDetail}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
            enableRowSelection={true}
            onSelectionChange={setSelectedStudents}
            actions={renderTableActions()}
            onAdd={openAdd}
            onRefresh={refetch}
            loading={loading}
          />
        </div>
      ) : loading ? (
        <LoadingSpinner />
      ) : (
        <StudentGrid students={filtered} onSelectStudent={setDetail} onEdit={openEdit} onDelete={setDeleteTarget} />
      )}

      <StudentDetail student={selectedStudent} onClose={() => { setDetail(null); onNavigate?.('students', null); }} onEdit={openEdit} onDelete={setDeleteTarget} onSuccess={refetch} defaultTab={params?.tab} />

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
