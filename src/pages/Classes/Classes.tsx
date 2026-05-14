import React from 'react'
import { Card, Button, Input, Select, Tabs, LoadingSpinner, EmptyState, Modal, InfoRow, StatusBadge, Badge, ConfirmDialog } from '../../components'
import { ClassTable } from './components/ClassTable'
import { ClassGrid } from './components/ClassGrid'
import { ClassFormModal } from './components/ClassFormModal'
import { useQuery, useCRUDPage, useListFilter, useEntityDelete } from '../../hooks'
import { getClasses, softDeleteClass } from '../../services'
import { mapClass } from '../../lib/mappers'
import type { Class } from '../../types/data'
import { useAppContext } from '../../context/AppContext'

export const Classes: React.FC = () => {
  const { selectedBranch, selectedYear } = useAppContext()
  const branchId = selectedBranch?.id
  const yearId = selectedYear?.id
  const { data: raw, loading, error, refetch } = useQuery(
    () => getClasses({ branchId, academicYearId: yearId }),
    [branchId, yearId]
  )
  const classes = (raw ?? []).map(mapClass)

  const {
    state: { search, filters, viewMode, showForm, editItem: editClass, deleteTarget, detailItem: detailClass },
    setSearch, setFilter, setViewMode,
    openAdd, openEdit, closeForm,
    setDetail, setDeleteTarget,
  } = useCRUDPage<Class>({ status: 'all', level: 'all' })

  const filtered = useListFilter(classes, search, filters, {
    searchKeys: ['name', (c: Class) => c.teacher ?? ''],
    filterMap: { status: 'status', level: 'level' },
  })

  const { handleDelete } = useEntityDelete<Class>({
    deleteFn: softDeleteClass,
    refetch,
    entityLabel: 'lớp học',
    getName: c => c.name,
    onSuccess: () => { setDeleteTarget(null); setDetail(null) },
  })

  const totalStudents = classes.reduce((a, c) => a + c.students, 0)

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
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>Quản lý lớp học</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{`${classes.length} lớp · ${totalStudents} học viên`}</div>
          </div>
          <Button icon="plus" onClick={openAdd}>Mở lớp mới</Button>
        </div>
      )}

      {viewMode === 'grid' && (
        <Card animate style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <Input placeholder="Tìm theo tên lớp, giáo viên..." value={search} onChange={setSearch} icon="search" />
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
                { value: 'inactive', label: 'Chưa khai giảng' },
                { value: 'completed', label: 'Đã kết thúc' },
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
        <ClassTable
          classes={classes}
          subtitle={`${classes.length} lớp · ${totalStudents} học viên`}
          onSelectClass={setDetail}
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
        <ClassGrid classes={filtered} onSelectClass={setDetail} onEdit={openEdit} onDelete={setDeleteTarget} />
      )}

      <Modal open={!!detailClass} onClose={() => setDetail(null)} title="Chi tiết lớp học" width={580}>
        {detailClass && (
          <div>
            <div style={{ padding: 20, background: 'var(--hover-bg)', borderRadius: 14, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)' }}>{detailClass.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>{detailClass.level} · {detailClass.ageGroup || 'N/A'} tuổi</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Badge variant={Math.round(detailClass.students / detailClass.maxStudents * 100) > 85 ? 'error' : 'success'}>
                    {detailClass.students}/{detailClass.maxStudents} HV
                  </Badge>
                  <StatusBadge status={detailClass.status} />
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <InfoRow icon="graduation" label="Giáo viên"  value={detailClass.teacher   || '—'} />
              <InfoRow icon="calendar"   label="Lịch học"   value={detailClass.schedule  || '—'} />
              <InfoRow icon="building"   label="Phòng"      value={detailClass.room      || '—'} />
              <InfoRow icon="wallet"     label="Học phí"    value={detailClass.fee       || 'Miễn phí'} />
              <InfoRow icon="clock"      label="Khai giảng" value={detailClass.startDate || '—'} />
              <InfoRow icon="clock"      label="Bế giảng"   value={detailClass.endDate   || '—'} />
            </div>
            <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border)', justifyContent: 'center' }}>
              <Button icon="edit"  variant="outline" onClick={() => openEdit(detailClass)}>Chỉnh sửa</Button>
              <Button icon="trash" variant="danger"  onClick={() => setDeleteTarget(detailClass)}>Xoá lớp</Button>
            </div>
          </div>
        )}
      </Modal>

      <ClassFormModal
        open={showForm}
        onClose={closeForm}
        onSuccess={refetch}
        classData={editClass}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xoá lớp học"
        message={`Bạn có chắc muốn xoá lớp "${deleteTarget?.name}"?`}
        confirmLabel="Xoá lớp"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default Classes
