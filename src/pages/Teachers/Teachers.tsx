import React, { useState } from 'react'
import { Card, Button, PageHeader, Input, Select, Tabs, LoadingSpinner, EmptyState, Modal, InfoRow, Avatar, StatusBadge, ConfirmDialog } from '../../components'
import { TeacherTable } from './components/TeacherTable'
import { TeacherGrid } from './components/TeacherGrid'
import { TeacherFormModal } from './components/TeacherFormModal'
import { useQuery } from '../../hooks'
import { getTeachers, softDeleteTeacher } from '../../services'
import { mapTeacher } from '../../lib/mappers'
import type { Teacher } from '../../types/data'

export const Teachers: React.FC = () => {
  const { data: raw, loading, error, refetch } = useQuery(getTeachers)
  const teachers = (raw ?? []).map(mapTeacher)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState('table')
  const [showForm, setShowForm] = useState(false)
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null)
  const [detailTeacher, setDetailTeacher] = useState<Teacher | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null)

  const filtered = teachers.filter(t => {
    const ms = t.name.toLowerCase().includes(search.toLowerCase()) ||
               t.email?.toLowerCase().includes(search.toLowerCase()) ||
               t.phone?.includes(search)
    const mf = filterStatus === 'all' || t.status === filterStatus
    return ms && mf
  })

  const activeCount = teachers.filter(t => t.status === 'active').length

  const handleEdit = (t: Teacher) => {
    setDetailTeacher(null)
    setEditTeacher(t)
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await softDeleteTeacher(String(deleteTarget.id))
    setDeleteTarget(null)
    setDetailTeacher(null)
    refetch()
  }

  const viewTabs = (
    <Tabs tabs={[{ id: 'table', label: '☰' }, { id: 'grid', label: '⊞' }]} active={viewMode} onChange={setViewMode} />
  )

  return (
    <div>
      <PageHeader
        title="Quản lý giáo viên"
        subtitle={`${teachers.length} giáo viên · ${activeCount} đang dạy`}
        actions={viewMode === 'grid' ? <Button icon="plus" onClick={() => { setEditTeacher(null); setShowForm(true) }}>Thêm giáo viên</Button> : undefined}
      />

      {viewMode === 'grid' && (
        <Card animate style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <Input placeholder="Tìm theo tên, email, SĐT..." value={search} onChange={setSearch} icon="search" />
            </div>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
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

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <EmptyState title="Lỗi tải dữ liệu" desc={error.message} />
      ) : viewMode === 'table' ? (
        <TeacherTable
          teachers={teachers}
          subtitle={`${teachers.length} giáo viên · ${activeCount} đang dạy`}
          onSelectTeacher={setDetailTeacher}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          actions={viewTabs}
          onAdd={() => { setEditTeacher(null); setShowForm(true) }}
          onRefresh={refetch}
        />
      ) : (
        <TeacherGrid
          teachers={filtered}
          onSelectTeacher={setDetailTeacher}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
        />
      )}

      {/* Detail modal */}
      <Modal open={!!detailTeacher} onClose={() => setDetailTeacher(null)} title="Thông tin giáo viên" width={520}>
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
              <InfoRow icon="phone" label="Điện thoại" value={detailTeacher.phone || '—'} />
              <InfoRow icon="mail" label="Email" value={detailTeacher.email || '—'} />
              <InfoRow icon="calendar" label="Ngày vào" value={detailTeacher.joinDate || '—'} />
              <InfoRow icon="award" label="Chuyên môn" value={detailTeacher.subjects?.join(', ') || '—'} />
            </div>
            <div style={{ display: 'flex', gap: 10, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <Button icon="edit" variant="outline" style={{ flex: 1 }} onClick={() => handleEdit(detailTeacher)}>Chỉnh sửa</Button>
              <Button icon="trash" variant="danger" style={{ flex: 1 }} onClick={() => setDeleteTarget(detailTeacher)}>Xoá</Button>
            </div>
          </div>
        )}
      </Modal>

      <TeacherFormModal open={showForm} onClose={() => { setShowForm(false); setEditTeacher(null) }} onSuccess={refetch} teacher={editTeacher} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xoá giáo viên"
        message={`Bạn có chắc muốn xoá giáo viên "${deleteTarget?.name}"?`}
        confirmLabel="Xoá"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default Teachers
