import React, { useState } from 'react';
import { PageHeader, Button, Card, Badge, StatusBadge, Icon, LoadingSpinner, EmptyState, Modal, InfoRow, ConfirmDialog } from '../../components';
import { useQuery } from '../../hooks';
import { getRooms, softDeleteRoom } from '../../services';
import { mapRoom } from '../../lib/mappers';
import { RoomFormModal } from './RoomFormModal';
import type { Room } from '../../types/data';

const STATUS_COLOR: Record<string, string> = {
  available: '#10B981',
  'in-use': '#3B82F6',
  maintenance: '#F59E0B',
};

const TYPE_ICON: Record<string, string> = {
  Kids: '🧸',
  Teens: '🎒',
  Multi: '🏫',
  Tutorial: '📖',
};

export const Rooms: React.FC = () => {
  const { data: raw, loading, error, refetch } = useQuery(getRooms);
  const rooms = (raw ?? []).map(mapRoom);

  const [showForm, setShowForm] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [detailRoom, setDetailRoom] = useState<Room | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = rooms.filter(r => filterStatus === 'all' || r.status === filterStatus);
  const available = rooms.filter(r => r.status === 'available').length;
  const inUse = rooms.filter(r => r.status === 'in-use').length;

  const handleEdit = (room: Room) => {
    setDetailRoom(null);
    setEditRoom(room);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await softDeleteRoom(String(deleteTarget.id));
    setDeleteTarget(null);
    setDetailRoom(null);
    refetch();
  };

  return (
    <div>
      <PageHeader
        title="Quản lý phòng học"
        subtitle={`${rooms.length} phòng · ${available} sẵn sàng · ${inUse} đang dùng`}
        actions={
          <Button icon="plus" onClick={() => { setEditRoom(null); setShowForm(true); }}>
            Thêm phòng
          </Button>
        }
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { v: 'all', l: 'Tất cả' },
          { v: 'available', l: 'Sẵn sàng' },
          { v: 'in-use', l: 'Đang dùng' },
          { v: 'maintenance', l: 'Bảo trì' },
        ].map(f => (
          <button key={f.v} onClick={() => setFilterStatus(f.v)}
            style={{
              padding: '8px 16px', borderRadius: 10, border: 'none',
              fontSize: 13, fontWeight: 600, fontFamily: 'var(--font)', cursor: 'pointer',
              background: filterStatus === f.v ? 'var(--primary)' : 'var(--hover-bg)',
              color: filterStatus === f.v ? '#fff' : 'var(--text-3)',
              transition: 'all 0.15s',
            }}>
            {f.l}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <EmptyState title="Lỗi tải dữ liệu" desc={error.message} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="building" title="Không có phòng nào" desc="Nhấn 'Thêm phòng' để tạo mới" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map((room, i) => (
            <Card
              key={room.id}
              hover
              animate
              delay={i * 60}
              style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
              onClick={() => setDetailRoom(room)}
            >
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 4,
                background: STATUS_COLOR[room.status] || 'var(--text-4)',
              }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: 'var(--hover-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20,
                  }}>
                    {TYPE_ICON[room.type] || '🏫'}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>{room.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Tầng {room.floor} · {room.type}</div>
                  </div>
                </div>
                <StatusBadge status={room.status} />
              </div>

              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-3)', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="users" size={13} />
                  {room.capacity} chỗ
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="settings" size={13} />
                  {room.equipment.length} thiết bị
                </div>
              </div>

              {room.equipment.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {room.equipment.slice(0, 3).map(eq => (
                    <Badge key={eq} variant="info" style={{ fontSize: 11 }}>{eq}</Badge>
                  ))}
                  {room.equipment.length > 3 && (
                    <Badge variant="info" style={{ fontSize: 11 }}>+{room.equipment.length - 3}</Badge>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!detailRoom} onClose={() => setDetailRoom(null)} title="Chi tiết phòng học" width={480}>
        {detailRoom && (
          <div>
            <div style={{ padding: 20, background: 'var(--hover-bg)', borderRadius: 14, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: 'var(--card)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                }}>
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
              <Button icon="edit" variant="outline" style={{ flex: 1 }} onClick={() => handleEdit(detailRoom)}>
                Chỉnh sửa
              </Button>
              <Button icon="trash" variant="danger" style={{ flex: 1 }} onClick={() => setDeleteTarget(detailRoom)}>
                Xoá phòng
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <RoomFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditRoom(null); }}
        onSuccess={refetch}
        room={editRoom}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xoá phòng học"
        message={`Bạn có chắc muốn xoá phòng "${deleteTarget?.name}"?`}
        confirmLabel="Xoá"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Rooms;
