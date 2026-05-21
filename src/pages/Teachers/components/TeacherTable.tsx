import React from 'react'
import ReactDOM from 'react-dom'
import { DataGrid, Avatar, Badge, StatusBadge, Icon, TextWithEllipse } from '../../../components'
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
  const ActionMenu = ({ t }: { t: Teacher }) => {
    const [open, setOpen] = React.useState(false)
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    const menuRef = React.useRef<HTMLDivElement>(null)
    const [coords, setCoords] = React.useState({ top: 0, left: 0 })
    
    const handleOpen = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (open) { setOpen(false); return }
      const rect = buttonRef.current?.getBoundingClientRect()
      if (rect) setCoords({ top: rect.bottom + 4, left: rect.left })
      setOpen(true)
    }

    React.useEffect(() => {
      if (!open) return
      const handleClick = (e: MouseEvent) => {
        if (menuRef.current?.contains(e.target as Node) || buttonRef.current?.contains(e.target as Node)) return
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
          <div ref={menuRef} style={{ position: 'fixed', top: coords.top, left: coords.left, zIndex: 999999, background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', borderRadius: 10, padding: 6, display: 'flex', flexDirection: 'column', minWidth: 140 }} onMouseDown={e => e.stopPropagation()}>
            <button onClick={e => { e.stopPropagation(); setOpen(false); onSelectTeacher(t) }} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', outline: 'none', cursor: 'pointer', color: 'var(--text-1)', padding: '10px 14px', borderRadius: 6, textAlign: 'left', width: '100%', fontSize: 13, fontWeight: 500, transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <Icon name="eye" size={15} /> Xem chi tiết
            </button>
            {onEdit && (
              <button onClick={e => { e.stopPropagation(); setOpen(false); onEdit(t) }} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', outline: 'none', cursor: 'pointer', color: 'var(--info)', padding: '10px 14px', borderRadius: 6, textAlign: 'left', width: '100%', fontSize: 13, fontWeight: 500, transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <Icon name="edit" size={15} /> Chỉnh sửa
              </button>
            )}
            {onDelete && (
              <button onClick={e => { e.stopPropagation(); setOpen(false); onDelete(t) }} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', outline: 'none', cursor: 'pointer', color: 'var(--error)', padding: '10px 14px', borderRadius: 6, textAlign: 'left', width: '100%', fontSize: 13, fontWeight: 500, transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <Icon name="trash" size={15} /> Xoá
              </button>
            )}
          </div>,
          document.body
        )}
      </>
    )
  }

  const columns: DataGridColumn<Teacher>[] = [
    {
      key: '_actions',
      title: 'Thao tác',
      sortable: false,
      width: 60,
      pin: 'left',
      render: t => <ActionMenu t={t} />,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      filterable: true,
      filterType: 'select',
      isAllowCopy: true,
      filterOptions: [
        { value: 'active', label: 'Đang dạy' },
        { value: 'on-leave', label: 'Nghỉ phép' },
        { value: 'inactive', label: 'Ngừng dạy' },
      ],
      render: t => <StatusBadge status={t.status} type="teacher" />,
    },
    {
      key: 'name',
      title: 'Giáo viên',
      filterable: true,
      isAllowCopy: true,
      render: t => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar initials={t.avatar || t.name[0]} size={32} color={t.color} />
          <div style={{ minWidth: 0 }}>
            <TextWithEllipse text={t.name} style={{ fontWeight: 600, color: 'var(--text-1)' }} />
            {t.joinDate && <TextWithEllipse text={`Vào: ${t.joinDate}`} style={{ fontSize: 11, color: 'var(--text-4)' }} />}
          </div>
        </div>
      ),
    },
    {
      key: 'nationality',
      title: 'Quốc tịch',
      filterable: true,
      isAllowCopy: true,
      render: t => <TextWithEllipse text={t.nationality || '—'} style={{ color: 'var(--text-2)' }} />,
    },
    {
      key: 'subjects',
      title: 'Chuyên môn',
      filterable: true,
      isAllowCopy: true,
      filterValue: t => (t.subjects ?? []).join(' '),
      render: t => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {t.subjects?.slice(0, 2).map(s => <Badge key={s} variant="info" style={{ fontSize: 11 }}>{s}</Badge>)}
          {(t.subjects?.length ?? 0) > 2 && <Badge variant="info" style={{ fontSize: 11 }}>+{(t.subjects?.length ?? 0) - 2}</Badge>}
          {(!t.subjects || t.subjects.length === 0) && <span style={{ color: 'var(--text-4)' }}>—</span>}
        </div>
      ),
    },
    {
      key: 'branches',
      title: 'Cơ sở',
      filterable: true,
      filterValue: t => (t.branches ?? []).join(' '),
      render: t => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {t.branches?.slice(0, 2).map(b => <Badge key={b} variant="default" style={{ fontSize: 11 }}>{b}</Badge>)}
          {(t.branches?.length ?? 0) > 2 && <Badge variant="default" style={{ fontSize: 11 }}>+{(t.branches?.length ?? 0) - 2}</Badge>}
          {(!t.branches || t.branches.length === 0) && <span style={{ color: 'var(--text-4)' }}>—</span>}
        </div>
      ),
    },
    { key: 'phone', title: 'Điện thoại', noWrap: true, isAllowCopy: true },
    {
      key: 'email',
      title: 'Email',
      filterable: true,
      isAllowCopy: true,
      render: t => <TextWithEllipse text={t.email || '—'} style={{ color: 'var(--text-2)' }} />,
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
