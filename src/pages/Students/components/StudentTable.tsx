import React from 'react'
import { DataGrid, Avatar, Badge, StatusBadge, Icon } from '../../../components'
import type { DataGridColumn } from '../../../components'
import type { Student } from '../../../types/data'

interface StudentTableProps {
  students: Student[]
  onSelectStudent: (s: Student) => void
  onEdit?: (s: Student) => void
  onDelete?: (s: Student) => void
  actions?: React.ReactNode
  subtitle?: string
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students, onSelectStudent, onEdit, onDelete, actions, subtitle,
}) => {
  const columns: DataGridColumn<Student>[] = [
    {
      key: 'name',
      title: 'Học viên',
      filterable: true,
      filterValue: s => s.name + ' ' + (s.parent ?? ''),
      render: s => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar initials={s.avatar || s.name[0]} size={32} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{s.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-4)' }}>
              {s.enrollDate ? `Nhập học: ${s.enrollDate}` : `#${String(s.id).slice(0, 6)}`}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'dob',
      title: 'Ngày sinh',
      filterable: true,
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
      render: s => <Badge variant="primary">{s.level}</Badge>,
    },
    {
      key: 'parent',
      title: 'Phụ huynh',
      filterable: true,
    },
    { key: 'phone', title: 'SĐT', noWrap: true },
    {
      key: 'status',
      title: 'Trạng thái',
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'active', label: 'Đang học' },
        { value: 'trial', label: 'Học thử' },
        { value: 'paused', label: 'Tạm nghỉ' },
        { value: 'inactive', label: 'Nghỉ học' },
      ],
      render: s => <StatusBadge status={s.status} />,
    },
    {
      key: '_actions',
      title: '',
      width: 72,
      render: s => (
        <div style={{ display: 'flex', gap: 4 }}>
          {onEdit && (
            <button
              onClick={e => { e.stopPropagation(); onEdit(s) }}
              title="Chỉnh sửa"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 4, borderRadius: 6 }}
            >
              <Icon name="edit" size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(s) }}
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
    <DataGrid<Student>
      title="Danh sách học viên"
      subtitle={subtitle}
      data={students}
      columns={columns}
      rowKey={s => s.id}
      onRowClick={onSelectStudent}
      exportFilename="hoc-vien"
      actions={actions}
    />
  )
}
