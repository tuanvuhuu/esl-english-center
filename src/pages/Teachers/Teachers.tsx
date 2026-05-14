import React from 'react'
import { Card, Button, Input, Select, Tabs, LoadingSpinner, EmptyState, Modal, InfoRow, Avatar, StatusBadge, ConfirmDialog } from '../../components'
import { TeacherTable } from './components/TeacherTable'
import { TeacherGrid } from './components/TeacherGrid'
import { TeacherFormModal } from './components/TeacherFormModal'
import { useQuery, useCRUDPage, useListFilter, useEntityDelete } from '../../hooks'
import { getTeachers, softDeleteTeacher } from '../../services'
import { mapTeacher } from '../../lib/mappers'
import type { Teacher } from '../../types/data'
import { useAppContext } from '../../context/AppContext'

export const Teachers: React.FC = () => {
  const { selectedBranch } = useAppContext()
  const branchId = selectedBranch?.id
  const { data: raw, loading, error, refetch } = useQuery(
    () => getTeachers({ branchId }),
    [branchId]
  )
  const teachers = (raw ?? []).map(mapTeacher)

  const {
    state: { search, filters, viewMode, showForm, editItem: editTeacher, deleteTarget, detailItem: detailTeacher },
    setSearch, setFilter, setViewMode,
    openAdd, openEdit, closeForm,
    setDetail, setDeleteTarget,
  } = useCRUDPage<Teacher>({ status: 'all' })

  const filtered = useListFilter(teachers, search, filters, {
    searchKeys: ['name', (t: Teacher) => t.email ?? '', (t: Teacher) => t.phone ?? ''],
    filterMap: { status: 'status' },
  })

  const { handleDelete } = useEntityDelete<Teacher>({
    deleteFn: softDeleteTeacher,
    refetch,
    entityLabel: 'giáo viên',
    getName: t => t.name,
    onSuccess: () => { setDeleteTarget(null); setDetail(null) },
  })

  const activeCount = teachers.filter(t => t.status === 'active').length

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
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>Quản lý giáo viên</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{`${teachers.length} giáo viên · ${activeCount} đang dạy`}</div>
          </div>
          <Button icon="plus" onClick={openAdd}>Thêm giáo viên</Button>
        </div>
      )}

      {viewMode === 'grid' && (
        <Card animate style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <Input placeholder="Tìm theo tên, email, SĐT..." value={search} onChange={setSearch} icon="search" />
            </div>
            <Select value={filters.status} onChange={v => setFilter('status', v)}
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'active', label: 'Đang dạy' },
                { value: 'on-leave', label: 'Nghỉ phép' },
                { value: 'inactive', label: 'Nghỉ việc' },
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
        <TeacherTable
          teachers={teachers}
          subtitle={`${teachers.length} giáo viên · ${activeCount} đang dạy`}
          onSelectTeacher={setDetail}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          actions={viewTabs}
          onAdd={openAdd}
          onRefresh={refetch}
          loading={loading}
        />
      ) : loading ? (
        <LoadingSpinner />
      ) : (
        <TeacherGrid
          teachers={filtered}
          onSelectTeacher={setDetail}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />
      )}

      <Modal open={!!detailTeacher} onClose={() => setDetail(null)} title="Thông tin giáo viên" width={520}>
        {detailTeacher && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 20, background: 'var(--hover-bg)', borderRadius: 14 }}>
              <Avatar initials={detailTeacher.avatar || detailTeacher.name[0]} size={56} color={detailTeacher.color} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>{detailTeacher.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{detailTeacher.nationality}</div>
                {detailTeacher.bio && <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 4 }}>{detailTeacher.bio}</div>}
              </div>
              <StatusBadge status={detailTeacher.status} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <InfoRow icon="phone"    label="Điện thoại" value={detailTeacher.phone    || '—'} />
              <InfoRow icon="mail"     label="Email"      value={detailTeacher.email    || '—'} />
              <InfoRow icon="calendar" label="Ngày vào"   value={detailTeacher.joinDate || '—'} />
              <InfoRow icon="award"    label="Chuyên môn" value={detailTeacher.subjects?.join(', ') || '—'} />
            </div>
            <div style={{ display: 'flex', gap: 10, paddingTop: 20, borderTop: '1px solid var(--border)', justifyContent: 'center' }}>
              <Button icon="edit"  variant="outline" onClick={() => openEdit(detailTeacher)}>Chỉnh sửa</Button>
              <Button icon="trash" variant="danger"  onClick={() => setDeleteTarget(detailTeacher)}>Xoá</Button>
            </div>
          </div>
        )}
      </Modal>

      <TeacherFormModal
        open={showForm}
        onClose={closeForm}
        onSuccess={refetch}
        teacher={editTeacher}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xoá giáo viên"
        message={`Bạn có chắc muốn xoá giáo viên "${deleteTarget?.name}"?`}
        confirmLabel="Xoá"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default Teachers
