import React from 'react'
import { DataGrid, Avatar, Badge, StatusBadge, Icon } from '../../../components'
import type { DataGridColumn } from '../../../components'
import type { Teacher } from '../../../types/data'

interface TeacherTableProps {
  teachers: Teacher[]
  onSelectTeacher: (t: Teacher) => void
  onEdit?: (t: Teacher) => void
  onDelete?: (t: Teacher) => void
  actions?: React.ReactNode
  subtitle?: string
  onAdd?: () => void
  onRefresh?: () => void
  loading?: boolean
}

export const TeacherTable: React.FC<TeacherTableProps> = ({
  teachers, onSelectTeacher, onEdit, onDelete, actions, subtitle, onAdd, onRefresh, loading,
}) => {
  const columns: DataGridColumn<Teacher>[] = [
    {
      key: 'name',
      title: 'Giáo viên',
      filterable: true,
      render: t => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar initials={t.avatar || t.name[0]} size={32} color={t.color} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{t.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{t.joinDate ? `Vào: ${t.joinDate}` : ''}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'nationality',
      title: 'Quốc tịch',
      filterable: true,
    },
    {
      key: 'subjects',
      title: 'Chuyên môn',
      filterable: true,
      filterValue: t => (t.subjects ?? []).join(' '),
      render: t => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {t.subjects?.slice(0, 2).map(s => <Badge key={s} variant="info" style={{ fontSize: 11 }}>{s}</Badge>)}
          {(t.subjects?.length ?? 0) > 2 && <Badge variant="info" style={{ fontSize: 11 }}>+{(t.subjects?.length ?? 0) - 2}</Badge>}
          {(!t.subjects || t.subjects.length === 0) && <span style={{ color: 'var(--text-4)' }}>—</span>}
        </div>
      ),
    },
    { key: 'phone', title: 'Điện thoại', noWrap: true },
    { key: 'email', title: 'Email', filterable: true },
    {
      key: 'status',
      title: 'Trạng thái',
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'active', label: 'Đang dạy' },
        { value: 'on-leave', label: 'Nghỉ phép' },
        { value: 'inactive', label: 'Ngừng dạy' },
      ],
      render: t => <StatusBadge status={t.status} />,
    },
    {
      key: '_actions',
      title: '',
      width: 72,
      render: t => (
        <div style={{ display: 'flex', gap: 4 }}>
          {onEdit && (
            <button
              onClick={e => { e.stopPropagation(); onEdit(t) }}
              title="Chỉnh sửa"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 4, borderRadius: 6 }}
            >
              <Icon name="edit" size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(t) }}
              title="Xoá"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: 4, borderRadius: 6 }}
            >
              <Icon name="trash" size={14} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <DataGrid<Teacher>
      title="Danh sách giáo viên"
      subtitle={subtitle}
      data={teachers}
      columns={columns}
      rowKey={t => t.id}
      onRowClick={onSelectTeacher}
      exportFilename="giao-vien"
      actions={actions}
      onAdd={onAdd}
      addLabel="Thêm giáo viên"
      onRefresh={onRefresh}
      loading={loading}
    />
  )
}
