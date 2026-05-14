import React from 'react'
import { DataGrid, Badge, StatusBadge, Icon } from '../../../components'
import type { DataGridColumn } from '../../../components'
import type { Class } from '../../../types/data'

interface ClassTableProps {
  classes: Class[]
  onSelectClass: (c: Class) => void
  onEdit?: (c: Class) => void
  onDelete?: (c: Class) => void
  actions?: React.ReactNode
  subtitle?: string
  onAdd?: () => void
  onRefresh?: () => void
}

const LVL_COLOR: Record<string, string> = { A1: '#FF6B35', A2: '#3B82F6', B1: '#10B981', B2: '#8B5CF6' }

export const ClassTable: React.FC<ClassTableProps> = ({
  classes, onSelectClass, onEdit, onDelete, actions, subtitle, onAdd, onRefresh,
}) => {
  const columns: DataGridColumn<Class>[] = [
    {
      key: 'name',
      title: 'Tên lớp',
      filterable: true,
      render: c => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 4, height: 28, borderRadius: 2, background: LVL_COLOR[c.level] || 'var(--text-4)', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{c.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{c.ageGroup ? `${c.ageGroup} tuổi` : ''}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'level',
      title: 'Trình độ',
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'A1', label: 'A1' },
        { value: 'A2', label: 'A2' },
        { value: 'B1', label: 'B1' },
        { value: 'B2', label: 'B2' },
      ],
      render: c => (
        <Badge style={{ background: LVL_COLOR[c.level] ? `${LVL_COLOR[c.level]}20` : undefined, color: LVL_COLOR[c.level], fontSize: 12 }}>
          {c.level}
        </Badge>
      ),
    },
    { key: 'teacher', title: 'Giáo viên', filterable: true },
    { key: 'room', title: 'Phòng', filterable: true },
    { key: 'schedule', title: 'Lịch học', noWrap: true },
    {
      key: 'students',
      title: 'Sĩ số',
      align: 'center',
      render: c => {
        const pct = Math.round((c.students / c.maxStudents) * 100)
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 48, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pct > 85 ? '#EF4444' : pct > 60 ? '#F59E0B' : '#10B981', borderRadius: 3 }} />
            </div>
            <span style={{ color: 'var(--text-2)' }}>{c.students}/{c.maxStudents}</span>
          </div>
        )
      },
    },
    { key: 'fee', title: 'Học phí', noWrap: true },
    {
      key: 'status',
      title: 'Trạng thái',
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'active', label: 'Đang học' },
        { value: 'paused', label: 'Tạm dừng' },
        { value: 'inactive', label: 'Kết thúc' },
      ],
      render: c => <StatusBadge status={c.status} />,
    },
    {
      key: '_actions',
      title: '',
      width: 72,
      render: c => (
        <div style={{ display: 'flex', gap: 4 }}>
          {onEdit && (
            <button
              onClick={e => { e.stopPropagation(); onEdit(c) }}
              title="Chỉnh sửa"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 4, borderRadius: 6 }}
            >
              <Icon name="edit" size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(c) }}
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
    <DataGrid<Class>
      title="Danh sách lớp học"
      subtitle={subtitle}
      data={classes}
      columns={columns}
      rowKey={c => c.id}
      onRowClick={onSelectClass}
      exportFilename="lop-hoc"
      actions={actions}
      onAdd={onAdd}
      addLabel="Mở lớp mới"
      onRefresh={onRefresh}
    />
  )
}
