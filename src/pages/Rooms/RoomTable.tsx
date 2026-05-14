import React from 'react'
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
  const columns: DataGridColumn<Room>[] = [
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
      key: '_actions',
      title: '',
      width: 72,
      render: r => (
        <div style={{ display: 'flex', gap: 4 }}>
          {onEdit && (
            <button
              onClick={e => { e.stopPropagation(); onEdit(r) }}
              title="Chỉnh sửa"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 4, borderRadius: 6 }}
            >
              <Icon name="edit" size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(r) }}
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
