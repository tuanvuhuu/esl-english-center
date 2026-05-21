import React from 'react'
import ReactDOM from 'react-dom'
import { DataGrid, Badge, StatusBadge, Icon, TextWithEllipse } from '../../../components'
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
  loading?: boolean
}

const LVL_COLOR: Record<string, string> = { A1: '#FF6B35', A2: '#3B82F6', B1: '#10B981', B2: '#8B5CF6' }

const ActionMenu = ({ c, onSelectClass, onEdit, onDelete }: {
  c: Class;
  onSelectClass?: (c: Class) => void;
  onEdit?: (c: Class) => void;
  onDelete?: (c: Class) => void;
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
          {onSelectClass && (
            <button
              onClick={e => { e.stopPropagation(); setOpen(false); onSelectClass(c) }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', outline: 'none', cursor: 'pointer', color: 'var(--text-1)', padding: '10px 14px', borderRadius: 6, textAlign: 'left', width: '100%', fontSize: 13, fontWeight: 500, transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <Icon name="eye" size={15} /> Xem chi tiết
            </button>
          )}
          {onEdit && (
            <button
              onClick={e => { e.stopPropagation(); setOpen(false); onEdit(c) }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', outline: 'none', cursor: 'pointer', color: 'var(--info)', padding: '10px 14px', borderRadius: 6, textAlign: 'left', width: '100%', fontSize: 13, fontWeight: 500, transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <Icon name="edit" size={15} /> Chỉnh sửa
            </button>
          )}
          {onDelete && (
            <button
              onClick={e => { e.stopPropagation(); setOpen(false); onDelete(c) }}
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

export const ClassTable: React.FC<ClassTableProps> = ({
  classes, onSelectClass, onEdit, onDelete, actions, subtitle, onAdd, onRefresh, loading,
}) => {
  const columns: DataGridColumn<Class>[] = [
    {
      key: '_actions',
      title: 'Thao tác',
      sortable: false,
      width: 60,
      pin: 'left',
      render: c => <ActionMenu c={c} onSelectClass={onSelectClass} onEdit={onEdit} onDelete={onDelete} />,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      filterable: true,
      isAllowCopy: true,
      filterType: 'select',
      filterOptions: [
        { value: 'active', label: 'Đang học' },
        { value: 'paused', label: 'Tạm dừng' },
        { value: 'inactive', label: 'Kết thúc' },
      ],
      render: c => <StatusBadge status={c.status} />,
    },
    {
      key: 'name',
      title: 'Tên lớp',
      filterable: true,
      isAllowCopy: true,
      render: c => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 4, height: 28, borderRadius: 2, background: LVL_COLOR[c.level] || 'var(--text-4)', flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <TextWithEllipse text={c.name} style={{ fontWeight: 600, color: 'var(--text-1)' }} />
            {c.ageGroup && <TextWithEllipse text={`${c.ageGroup} tuổi`} style={{ fontSize: 11, color: 'var(--text-4)' }} />}
          </div>
        </div>
      ),
    },
    {
      key: 'level',
      title: 'Trình độ',
      filterable: true,
      isAllowCopy: true,
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
    {
      key: 'teacher',
      title: 'Giáo viên',
      filterable: true,
      isAllowCopy: true,
      render: c => <TextWithEllipse text={c.teacher || '—'} style={{ color: 'var(--text-2)' }} />,
    },
    {
      key: 'assistantNames',
      title: 'Trợ giảng',
      filterable: true,
      filterValue: c => (c.assistantNames ?? []).join(' '),
      render: c => {
        const names = c.assistantNames ?? []
        if (names.length === 0) return <span style={{ color: 'var(--text-4)' }}>—</span>
        return (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {names.slice(0, 2).map(n => (
              <Badge key={n} variant="default" style={{ fontSize: 11 }}>{n}</Badge>
            ))}
            {names.length > 2 && (
              <Badge variant="default" style={{ fontSize: 11 }}>+{names.length - 2}</Badge>
            )}
          </div>
        )
      },
    },
    {
      key: 'room',
      title: 'Phòng',
      filterable: true,
      isAllowCopy: true,
      render: c => <TextWithEllipse text={c.room || '—'} style={{ color: 'var(--text-2)' }} />,
    },
    { key: 'schedule', title: 'Lịch học', noWrap: true, isAllowCopy: true },
    {
      key: 'students',
      title: 'Sĩ số',
      align: 'center',
      isAllowCopy: true,
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
    { key: 'fee', title: 'Học phí', noWrap: true, isAllowCopy: true },
    {
      key: 'progress',
      title: 'Tiến độ',
      align: 'center',
      render: c => {
        if (!c.totalSessions) return <span style={{ color: 'var(--text-4)' }}>—</span>
        const pct = Math.min(100, Math.round(((c.completedSessions || 0) / c.totalSessions) * 100))
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 48, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: '#3B82F6', borderRadius: 3 }} />
            </div>
            <span style={{ color: 'var(--text-2)', fontSize: 12 }}>{c.completedSessions}/{c.totalSessions}</span>
          </div>
        )
      },
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
      loading={loading}
    />
  )
}
