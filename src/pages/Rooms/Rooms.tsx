import React from 'react'
import { Card, Button, Input, Select, Tabs, Badge, StatusBadge, Icon, LoadingSpinner, EmptyState, Modal, InfoRow, ConfirmDialog } from '../../components'
import { RoomTable } from './RoomTable'
import { RoomFormModal } from './RoomFormModal'
import { useQuery, useCRUDPage, useListFilter, useEntityDelete } from '../../hooks'
import { getRooms, softDeleteRoom } from '../../services'
import { mapRoom } from '../../lib/mappers'
import type { Room } from '../../types/data'
import { useAppContext } from '../../context/AppContext'

const STATUS_COLOR: Record<string, string> = {
  available: '#10B981', 'in-use': '#3B82F6', maintenance: '#F59E0B',
}
const TYPE_ICON: Record<string, string> = {
  Kids: '🧸', Teens: '🎒', Multi: '🏫', Tutorial: '📖',
}

export const Rooms: React.FC = () => {
  const { selectedBranch } = useAppContext()
  const branchId = selectedBranch?.id
  const { data: raw, loading, error, refetch } = useQuery(
    () => getRooms(branchId),
    [branchId]
  )
  const rooms = (raw ?? []).map(mapRoom)

  const {
    state: { search, filters, viewMode, showForm, editItem: editRoom, deleteTarget, detailItem: detailRoom },
    setSearch, setFilter, setViewMode,
    openAdd, openEdit, closeForm,
    setDetail, setDeleteTarget,
  } = useCRUDPage<Room>({ status: 'all' })

  const filtered = useListFilter(rooms, search, filters, {
    searchKeys: ['name'],
    filterMap: { status: 'status' },
  })

  const { handleDelete } = useEntityDelete<Room>({
    deleteFn: softDeleteRoom,
    refetch,
    entityLabel: 'phòng học',
    getName: r => r.name,
    onSuccess: () => { setDeleteTarget(null); setDetail(null) },
  })

  const available = rooms.filter(r => r.status === 'available').length
  const inUse     = rooms.filter(r => r.status === 'in-use').length

  const viewTabs = (
    <Tabs
      tabs={[
        { id: 'table', label: '☰', tooltip: 'Dạng bảng' },
        { id: 'grid',  label: '⊞', tooltip: 'Dạng lưới' },
      ]}
      active={viewMode}
      onChange={v => setViewMode(v as 'table' | 'grid')}
    />
  )

  return (
    <div>
      {viewMode === 'grid' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>Quản lý phòng học</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{`${rooms.length} phòng · ${available} sẵn sàng · ${inUse} đang dùng`}</div>
          </div>
          <Button icon="plus" onClick={openAdd}>Thêm phòng</Button>
        </div>
      )}

      {viewMode === 'grid' && (
        <Card animate style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <Input placeholder="Tìm theo tên phòng..." value={search} onChange={setSearch} icon="search" />
            </div>
            <Select value={filters.status} onChange={v => setFilter('status', v)}
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

      {error ? (
        <EmptyState title="Lỗi tải dữ liệu" desc={error.message} />
      ) : viewMode === 'table' ? (
        <RoomTable
          rooms={rooms}
          subtitle={`${rooms.length} phòng · ${available} sẵn sàng · ${inUse} đang dùng`}
          onSelectRoom={setDetail}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          actions={viewTabs}
          onAdd={openAdd}
          onRefresh={refetch}
          loading={loading}
        />
      ) : loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState icon="building" title="Không có phòng nào" desc="Nhấn 'Thêm phòng' để tạo mới" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map((room, i) => (
            <Card key={room.id} hover animate delay={i * 60}
              style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
              onClick={() => setDetail(room)}
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
                <button onClick={() => openEdit(room)}
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

      <Modal open={!!detailRoom} onClose={() => setDetail(null)} title="Chi tiết phòng học" width={480}>
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
              <InfoRow icon="users"    label="Sức chứa" value={`${detailRoom.capacity} người`} />
              <InfoRow icon="building" label="Tầng"     value={`Tầng ${detailRoom.floor}`} />
            </div>
            {detailRoom.equipment.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>Trang thiết bị</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {detailRoom.equipment.map(eq => <Badge key={eq} variant="info">{eq}</Badge>)}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border)', justifyContent: 'center' }}>
              <Button icon="edit"  variant="outline" onClick={() => openEdit(detailRoom)}>Chỉnh sửa</Button>
              <Button icon="trash" variant="danger"  onClick={() => setDeleteTarget(detailRoom)}>Xoá phòng</Button>
            </div>
          </div>
        )}
      </Modal>

      <RoomFormModal
        open={showForm}
        onClose={closeForm}
        onSuccess={refetch}
        room={editRoom}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xoá phòng học"
        message={`Bạn có chắc muốn xoá phòng "${deleteTarget?.name}"?`}
        confirmLabel="Xoá"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default Rooms
