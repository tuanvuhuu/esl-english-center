import React, { useState } from 'react'
import { Card, Button, PageHeader, Input, Select, Tabs, LoadingSpinner, EmptyState, Modal, InfoRow, StatusBadge, Badge, ConfirmDialog } from '../../components'
import { ClassTable } from './components/ClassTable'
import { ClassGrid } from './components/ClassGrid'
import { ClassFormModal } from './components/ClassFormModal'
import { useQuery } from '../../hooks'
import { getClasses, softDeleteClass } from '../../services'
import { mapClass } from '../../lib/mappers'
import type { Class } from '../../types/data'

export const Classes: React.FC = () => {
  const { data: raw, loading, error, refetch } = useQuery(getClasses)
  const classes = (raw ?? []).map(mapClass)

  const [search, setSearch] = useState('')
  const [filterLevel, setFilterLevel] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState('table')
  const [showForm, setShowForm] = useState(false)
  const [editClass, setEditClass] = useState<Class | null>(null)
  const [detailClass, setDetailClass] = useState<Class | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Class | null>(null)

  const filtered = classes.filter(c => {
    const ms = c.name.toLowerCase().includes(search.toLowerCase()) ||
               c.teacher?.toLowerCase().includes(search.toLowerCase())
    const ml = filterLevel === 'all' || c.level === filterLevel
    const mf = filterStatus === 'all' || c.status === filterStatus
    return ms && ml && mf
  })

  const totalStudents = classes.reduce((a, c) => a + c.students, 0)

  const handleEdit = (c: Class) => {
    setDetailClass(null)
    setEditClass(c)
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await softDeleteClass(String(deleteTarget.id))
    setDeleteTarget(null)
    setDetailClass(null)
    refetch()
  }

  const viewTabs = (
    <Tabs tabs={[{ id: 'table', label: '☰' }, { id: 'grid', label: '⊞' }]} active={viewMode} onChange={setViewMode} />
  )

  return (
    <div>
      <PageHeader
        title="Quản lý lớp học"
        subtitle={`${classes.length} lớp · ${totalStudents} học viên`}
        actions={
          <Button icon="plus" onClick={() => { setEditClass(null); setShowForm(true) }}>
            Mở lớp mới
          </Button>
        }
      />

      {viewMode === 'grid' && (
        <Card animate style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <Input placeholder="Tìm theo tên lớp, giáo viên..." value={search} onChange={setSearch} icon="search" />
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
                { value: 'inactive', label: 'Chưa khai giảng' },
                { value: 'completed', label: 'Đã kết thúc' },
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
        <ClassTable
          classes={classes}
          subtitle={`${classes.length} lớp · ${totalStudents} học viên`}
          onSelectClass={setDetailClass}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          actions={viewTabs}
        />
      ) : (
        <ClassGrid classes={filtered} onSelectClass={setDetailClass} onEdit={handleEdit} onDelete={setDeleteTarget} />
      )}

      {/* Detail modal */}
      <Modal open={!!detailClass} onClose={() => setDetailClass(null)} title="Chi tiết lớp học" width={580}>
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
              <InfoRow icon="graduation" label="Giáo viên" value={detailClass.teacher || '—'} />
              <InfoRow icon="calendar" label="Lịch học" value={detailClass.schedule || '—'} />
              <InfoRow icon="building" label="Phòng" value={detailClass.room || '—'} />
              <InfoRow icon="wallet" label="Học phí" value={detailClass.fee || 'Miễn phí'} />
              <InfoRow icon="clock" label="Khai giảng" value={detailClass.startDate || '—'} />
              <InfoRow icon="clock" label="Bế giảng" value={detailClass.endDate || '—'} />
            </div>
            <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <Button icon="edit" variant="outline" style={{ flex: 1 }} onClick={() => handleEdit(detailClass)}>Chỉnh sửa</Button>
              <Button icon="trash" variant="danger" style={{ flex: 1 }} onClick={() => setDeleteTarget(detailClass)}>Xoá lớp</Button>
            </div>
          </div>
        )}
      </Modal>

      <ClassFormModal open={showForm} onClose={() => { setShowForm(false); setEditClass(null) }} onSuccess={refetch} classData={editClass} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xoá lớp học"
        message={`Bạn có chắc muốn xoá lớp "${deleteTarget?.name}"?`}
        confirmLabel="Xoá lớp"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default Classes
