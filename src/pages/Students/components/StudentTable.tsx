import React from 'react'
import ReactDOM from 'react-dom'
import { DataGrid, Avatar, Badge, StatusBadge, Icon, TextWithEllipse } from '../../../components'
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
  title?: string
}

const ActionMenu = ({ s, onSelectStudent, onEdit, onDelete }: {
  s: Student;
  onSelectStudent?: (s: Student) => void;
  onEdit?: (s: Student) => void;
  onDelete?: (s: Student) => void;
}) => {
  const [open, setOpen] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [coords, setCoords] = React.useState({ top: 0, left: 0 })
  
  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (open) {
      setOpen(false)
      return
    }
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) {
      setCoords({ top: rect.bottom + 4, left: rect.left })
    }
    setOpen(true)
  }

  React.useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (
        (menuRef.current && menuRef.current.contains(e.target as Node)) ||
        (buttonRef.current && buttonRef.current.contains(e.target as Node))
      ) {
        return
      }
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const handleScroll = () => setOpen(false)
    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        style={{ display: 'flex', outline: 'none', alignItems: 'center', justifyContent: 'center', background: open ? 'var(--hover-bg)' : 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: '6px', borderRadius: '50%', transition: 'all 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent' }}
      >
        <Icon name="more-horizontal" size={16} />
      </button>
      {open && ReactDOM.createPortal(
        <div 
          ref={menuRef}
          style={{ position: 'fixed', top: coords.top, left: coords.left, zIndex: 999999, background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', borderRadius: 10, padding: 6, display: 'flex', flexDirection: 'column', minWidth: 140 }}
          onMouseDown={e => e.stopPropagation()}
        >
          {onSelectStudent && (
            <button
              onClick={e => { e.stopPropagation(); setOpen(false); onSelectStudent(s) }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', outline: 'none', cursor: 'pointer', color: 'var(--text-1)', padding: '10px 14px', borderRadius: 6, textAlign: 'left', width: '100%', fontSize: 13, fontWeight: 500, transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <Icon name="eye" size={15} /> Xem chi tiết
            </button>
          )}
          {onEdit && (
            <button
              onClick={e => { e.stopPropagation(); setOpen(false); onEdit(s) }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', outline: 'none', cursor: 'pointer', color: 'var(--info)', padding: '10px 14px', borderRadius: 6, textAlign: 'left', width: '100%', fontSize: 13, fontWeight: 500, transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <Icon name="edit" size={15} /> Chỉnh sửa
            </button>
          )}
          {onDelete && (
            <button
              onClick={e => { e.stopPropagation(); setOpen(false); onDelete(s) }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', outline: 'none', cursor: 'pointer', color: 'var(--error)', padding: '10px 14px', borderRadius: 6, textAlign: 'left', width: '100%', fontSize: 13, fontWeight: 500, transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <Icon name="trash" size={15} /> Xoá
            </button>
          )}
        </div>,
        document.body
      )}
    </>
  )
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students, onSelectStudent, onEdit, onDelete, onSelectionChange, enableRowSelection, actions, subtitle, onAdd, onRefresh, loading, title
}) => {
  const columns: DataGridColumn<Student>[] = [
    {
      key: '_actions',
      title: 'Thao tác',
      sortable: false,
      width: 60,
      pin: 'left',
      render: s => <ActionMenu s={s} onSelectStudent={onSelectStudent} onEdit={onEdit} onDelete={onDelete} />,
    },
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
      render: s => <StatusBadge status={s.status} type="student" />,
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
      render: s => {
        const levelVariantMap: Record<string, 'error' | 'info' | 'success' | 'warning'> = {
          A1: 'error',
          A2: 'info',
          B1: 'success',
          B2: 'warning',
        }
        return <Badge variant={levelVariantMap[s.level?.toUpperCase()] || 'primary'}>{s.level}</Badge>
      },
    },
    {
      key: 'attendance',
      title: 'Điểm danh',
      align: 'center',
      render: s => {
        if (s.attendanceRate === undefined) return <span style={{ color: 'var(--text-4)' }}>—</span>
        const rate = Math.round(s.attendanceRate)
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: rate >= 80 ? '#10B981' : rate >= 50 ? '#F59E0B' : '#EF4444' }}>
              {rate}%
            </span>
            {s.absenceCount !== undefined && s.absenceCount > 0 && (
              <span style={{ fontSize: 11, color: 'var(--error)' }}>Vắng {s.absenceCount}</span>
            )}
          </div>
        )
      },
    },
    {
      key: 'dob',
      title: 'Ngày sinh',
      sortable: true,
      filterable: true,
      isAllowCopy: true,
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
  ]

  return (
    <DataGrid<Student>
      title={title === undefined ? 'Danh sách học viên' : title}
      subtitle={subtitle}
      data={students}
      columns={columns}
      rowKey={s => s.id}
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
