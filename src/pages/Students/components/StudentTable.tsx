import React from 'react'
import { DataGrid, Avatar, Badge, Icon, TextWithEllipse } from '../../../components'
import type { DataGridColumn } from '../../../components'
import type { Student } from '../../../types/data'

interface StudentTableProps {
  students: Student[]
  onSelectStudent: (s: Student) => void
  onEdit?: (s: Student) => void
  onDelete?: (s: Student) => void
  onSelectionChange?: (selected: Student[]) => void
  enableRowSelection?: boolean
  actions?: React.ReactNode
  subtitle?: string
  onAdd?: () => void
  onRefresh?: () => void
  loading?: boolean
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students, onSelectStudent, onEdit, onDelete, onSelectionChange, enableRowSelection, actions, subtitle, onAdd, onRefresh, loading,
}) => {
  const columns: DataGridColumn<Student>[] = [
    {
      key: 'name',
      title: 'Học viên',
      sortable: true,
      filterable: true,
      isAllowCopy: true,
      filterValue: s => s.name + ' ' + (s.parent ?? ''),
      render: s => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar initials={s.avatar || s.name[0]} size={32} />
          <div style={{ minWidth: 0 }}>
            <TextWithEllipse text={s.name} style={{ fontWeight: 600, color: 'var(--text-1)' }} />
            <TextWithEllipse text={s.enrollDate ? `Ngày nhập học: ${s.enrollDate}` : `#${String(s.id).slice(0, 6)}`} style={{ fontSize: 11, color: 'var(--text-4)' }} />
          </div>
        </div>
      ),
    },
    {
      key: 'dob',
      title: 'Ngày sinh',
      sortable: true,
      filterable: true,
      isAllowCopy: true,
    },
    {
      key: 'level',
      title: 'Trình độ',
      sortable: true,
      filterable: true,
      isAllowCopy: true,
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
      sortable: true,
      filterable: true,
      isAllowCopy: true,
      render: s => <TextWithEllipse text={s.parent || '—'} style={{ color: 'var(--text-2)' }} />,
    },
    { key: 'phone', title: 'SĐT', sortable: true, noWrap: true, isAllowCopy: true },
    {
      key: 'status',
      title: 'Trạng thái',
      sortable: true,
      filterable: true,
      isAllowCopy: true,
      filterType: 'select',
      filterOptions: [
        { value: 'active', label: 'Đang học' },
        { value: 'trial', label: 'Học thử' },
        { value: 'paused', label: 'Tạm nghỉ' },
        { value: 'inactive', label: 'Nghỉ học' },
      ],
      render: s => {
        const statusMap: Record<string, string> = {
          active: 'Đang học',
          trial: 'Học thử',
          paused: 'Tạm nghỉ',
          inactive: 'Nghỉ học',
        }
        return <Badge variant="primary">{statusMap[s.status] || s.status}</Badge>
      },
    },
    {
      key: '_actions',
      title: '',
      sortable: false,
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
      onAdd={onAdd}
      addLabel="Thêm học viên"
      onRefresh={onRefresh}
      loading={loading}
      enableRowSelection={enableRowSelection}
      onSelectionChange={onSelectionChange}
    />
  )
}
