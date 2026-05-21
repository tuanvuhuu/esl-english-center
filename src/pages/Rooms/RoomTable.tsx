import React from 'react'
import ReactDOM from 'react-dom'
import { DataGrid, Badge, StatusBadge, Icon } from '../../components'
import type { DataGridColumn } from '../../components'
import type { Room } from '../../types/data'

interface RoomTableProps {
  rooms: Room[]
  onSelectRoom: (r: Room) => void
  onEdit?: (r: Room) => void
  onDelete?: (r: Room) => void
  actions?: React.ReactNode
  subtitle?: string
  onAdd?: () => void
  onRefresh?: () => void
  loading?: boolean
}

export const RoomTable: React.FC<RoomTableProps> = ({
  rooms, onSelectRoom, onEdit, onDelete, actions, subtitle, onAdd, onRefresh, loading,
}) => {
  const ActionMenu = ({ r }: { r: Room }) => {
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
        <button ref={buttonRef} onClick={handleOpen} style={{ display: 'flex', outline: 'none', alignItems: 'center', justifyContent: 'center', background: open ? 'var(--hover-bg)' : 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: '6px', borderRadius: '50%', transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'} onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent' }}>
          <Icon name="more-horizontal" size={16} />
        </button>
        {open && ReactDOM.createPortal(
          <div ref={menuRef} style={{ position: 'fixed', top: coords.top, left: coords.left, zIndex: 999999, background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', borderRadius: 10, padding: 6, display: 'flex', flexDirection: 'column', minWidth: 140 }} onMouseDown={e => e.stopPropagation()}>
            <button onClick={e => { e.stopPropagation(); setOpen(false); onSelectRoom(r) }} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', outline: 'none', cursor: 'pointer', color: 'var(--text-1)', padding: '10px 14px', borderRadius: 6, textAlign: 'left', width: '100%', fontSize: 13, fontWeight: 500, transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <Icon name="eye" size={15} /> Xem chi tiết
            </button>
            {onEdit && (
              <button onClick={e => { e.stopPropagation(); setOpen(false); onEdit(r) }} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', outline: 'none', cursor: 'pointer', color: 'var(--info)', padding: '10px 14px', borderRadius: 6, textAlign: 'left', width: '100%', fontSize: 13, fontWeight: 500, transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <Icon name="edit" size={15} /> Chỉnh sửa
              </button>
            )}
            {onDelete && (
              <button onClick={e => { e.stopPropagation(); setOpen(false); onDelete(r) }} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', outline: 'none', cursor: 'pointer', color: 'var(--error)', padding: '10px 14px', borderRadius: 6, textAlign: 'left', width: '100%', fontSize: 13, fontWeight: 500, transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <Icon name="trash" size={15} /> Xoá
              </button>
            )}
          </div>,
          document.body
        )}
      </>
    )
  }

  const columns: DataGridColumn<Room>[] = [
    {
      key: '_actions',
      title: 'Thao tác',
      sortable: false,
      width: 60,
      pin: 'left',
      render: r => <ActionMenu r={r} />,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      filterable: true,
      isAllowCopy: true,
      filterType: 'select',
      filterOptions: [
        { value: 'available', label: 'Sẵn sàng' },
        { value: 'in-use', label: 'Đang dùng' },
        { value: 'maintenance', label: 'Bảo trì' },
      ],
      render: r => <StatusBadge status={r.status} />,
    },
    {
      key: 'name',
      title: 'Phòng',
      filterable: true,
      isAllowCopy: true,
      render: r => <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{r.name}</span>,
    },
    {
      key: 'floor',
      title: 'Tầng',
      isAllowCopy: true,
      render: r => <span style={{ color: 'var(--text-2)' }}>Tầng {r.floor || '—'}</span>,
    },
    {
      key: 'type',
      title: 'Loại',
      filterable: true,
      isAllowCopy: true,
      filterType: 'select',
      filterOptions: [
        { value: 'Kids', label: 'Kids' },
        { value: 'Teens', label: 'Teens' },
        { value: 'Multi', label: 'Multi' },
        { value: 'Tutorial', label: 'Tutorial' },
      ],
      render: r => <Badge variant="info">{r.type || '—'}</Badge>,
    },
    {
      key: 'capacity',
      title: 'Sức chứa',
      align: 'center',
      isAllowCopy: true,
      render: r => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-2)' }}>
          <Icon name="users" size={13} />{r.capacity} chỗ
        </div>
      ),
    },
    {
      key: 'equipment',
      title: 'Trang thiết bị',
      filterable: true,
      isAllowCopy: true,
      filterValue: r => r.equipment.join(' '),
      render: r => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {r.equipment.slice(0, 3).map(eq => <Badge key={eq} variant="info" style={{ fontSize: 11 }}>{eq}</Badge>)}
          {r.equipment.length > 3 && <Badge variant="info" style={{ fontSize: 11 }}>+{r.equipment.length - 3}</Badge>}
          {r.equipment.length === 0 && <span style={{ color: 'var(--text-4)' }}>—</span>}
        </div>
      ),
    },
  ]

  return (
    <DataGrid<Room>
      title="Danh sách phòng học"
      subtitle={subtitle}
      data={rooms}
      columns={columns}
      rowKey={r => r.id}
      onRowClick={onSelectRoom}
      exportFilename="phong-hoc"
      actions={actions}
      onAdd={onAdd}
      addLabel="Thêm phòng"
      onRefresh={onRefresh}
      loading={loading}
    />
  )
}
