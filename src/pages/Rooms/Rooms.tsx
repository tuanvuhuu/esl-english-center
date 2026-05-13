import React, { useState } from 'react'
import { Card, Button, PageHeader, Input, Select, Tabs, Badge, StatusBadge, Icon, LoadingSpinner, EmptyState, Modal, InfoRow, ConfirmDialog } from '../../components'
import { RoomTable } from './RoomTable'
import { RoomFormModal } from './RoomFormModal'
import { useQuery } from '../../hooks'
import { getRooms, softDeleteRoom } from '../../services'
import { mapRoom } from '../../lib/mappers'
import type { Room } from '../../types/data'

const STATUS_COLOR: Record<string, string> = {
  available: '#10B981', 'in-use': '#3B82F6', maintenance: '#F59E0B',
}
const TYPE_ICON: Record<string, string> = {
  Kids: '🧸', Teens: '🎒', Multi: '🏫', Tutorial: '📖',
}

export const Rooms: React.FC = () => {
  const { data: raw, loading, error, refetch } = useQuery(getRooms)
  const rooms = (raw ?? []).map(mapRoom)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState('table')
  const [showForm, setShowForm] = useState(false)
  const [editRoom, setEditRoom] = useState<Room | null>(null)
  const [detailRoom, setDetailRoom] = useState<Room | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null)

  const filtered = rooms.filter(r => {
    const ms = r.name.toLowerCase().includes(search.toLowerCase())
    const mf = filterStatus === 'all' || r.status === filterStatus
    return ms && mf
  })

  const available = rooms.filter(r => r.status === 'available').length
  const inUse = rooms.filter(r => r.status === 'in-use').length

  const handleEdit = (room: Room) => {
    setDetailRoom(null)
    setEditRoom(room)
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await softDeleteRoom(String(deleteTarget.id))
    setDeleteTarget(null)
    setDetailRoom(null)
    refetch()
  }

  const viewTabs = (
    <Tabs tabs={[{ id: 'table', label: '☰' }, { id: 'grid', label: '⊞' }]} active={viewMode} onChange={setViewMode} />
  )

  return (
    <div>
      <PageHeader
        title="Quản lý phòng học"
        subtitle={`${rooms.length} phòng · ${available} sẵn sàng · ${inUse} đang dùng`}
        actions={
          <Button icon="plus" onClick={() => { setEditRoom(null); setShowForm(true) }}>
            Thêm phòng
          </Button>
        }
      />

      {viewMode === 'grid' && (
        <Card animate style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <Input placeholder="Tìm theo tên phòng..." value={search} onChange={setSearch} icon="search" />
            </div>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'available', label: 'Sẵn sàng' },
                { value: 'in-use', label: 'Đang dùng' },
                { value: 'maintenance', label: 'Bảo trì' },
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
        <RoomTable
          rooms={rooms}
          subtitle={`${rooms.length} phòng · ${available} sẵn sàng · ${inUse} đang dùng`}
          onSelectRoom={setDetailRoom}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          actions={viewTabs}
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon="building" title="Không có phòng nào" desc="Nhấn 'Thêm phòng' để tạo mới" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map((room, i) => (
            <Card key={room.id} hover animate delay={i * 60}
              style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
              onClick={() => setDetailRoom(room)}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: STATUS_COLOR[room.status] || 'var(--text-4)' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--hover-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    {TYPE_ICON[room.type] || '🏫'}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{room.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Tầng {room.floor} · {room.type}</div>
                  </div>
                </div>
                <StatusBadge status={room.status} />
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name="users" size={12} />{room.capacity} chỗ
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name="settings" size={12} />{room.equipment.length} thiết bị
                </div>
              </div>
              {room.equipment.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                  {room.equipment.slice(0, 3).map(eq => <Badge key={eq} variant="info" style={{ fontSize: 11 }}>{eq}</Badge>)}
                  {room.equipment.length > 3 && <Badge variant="info" style={{ fontSize: 11 }}>+{room.equipment.length - 3}</Badge>}
                </div>
              )}
              <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                <button onClick={() => handleEdit(room)}
                  style={{ background: 'var(--hover-bg)', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '4px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: 'var(--font)' }}>
                  <Icon name="edit" size={13} /> Sửa
                </button>
                <button onClick={() => setDeleteTarget(room)}
                  style={{ background: 'var(--hover-bg)', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '4px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: 'var(--font)' }}>
                  <Icon name="trash" size={13} /> Xoá
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <Modal open={!!detailRoom} onClose={() => setDetailRoom(null)} title="Chi tiết phòng học" width={480}>
        {detailRoom && (
          <div>
            <div style={{ padding: 20, background: 'var(--hover-bg)', borderRadius: 14, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                  {TYPE_ICON[detailRoom.type] || '🏫'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)' }}>{detailRoom.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Tầng {detailRoom.floor} · {detailRoom.type}</div>
                </div>
                <StatusBadge status={detailRoom.status} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <InfoRow icon="users" label="Sức chứa" value={`${detailRoom.capacity} người`} />
              <InfoRow icon="building" label="Tầng" value={`Tầng ${detailRoom.floor}`} />
            </div>
            {detailRoom.equipment.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>Trang thiết bị</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {detailRoom.equipment.map(eq => <Badge key={eq} variant="info">{eq}</Badge>)}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <Button icon="edit" variant="outline" style={{ flex: 1 }} onClick={() => handleEdit(detailRoom)}>Chỉnh sửa</Button>
              <Button icon="trash" variant="danger" style={{ flex: 1 }} onClick={() => setDeleteTarget(detailRoom)}>Xoá phòng</Button>
            </div>
          </div>
        )}
      </Modal>

      <RoomFormModal open={showForm} onClose={() => { setShowForm(false); setEditRoom(null) }} onSuccess={refetch} room={editRoom} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xoá phòng học"
        message={`Bạn có chắc muốn xoá phòng "${deleteTarget?.name}"?`}
        confirmLabel="Xoá"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default Rooms
