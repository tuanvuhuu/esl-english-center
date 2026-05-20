import React, { useState, useEffect } from 'react'
import { Modal, Avatar, InfoRow, Button, Badge, Icon, Tabs, EntityHistoryTimeline } from '../../../components'
import { initials } from '../../../lib/mappers'
import type { DbParent } from '../../../services/parents'

interface Props {
  parent: DbParent | null
  onClose: () => void
  onEdit?: (p: DbParent) => void
  onDelete?: (p: DbParent) => void
  defaultTab?: 'info' | 'history'
}

const RELATION_LABEL: Record<string, string> = {
  father: 'Bố', mother: 'Mẹ', grandfather: 'Ông', grandmother: 'Bà',
  guardian: 'Người giám hộ', other: 'Khác',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Đang học', trial: 'Học thử', paused: 'Tạm nghỉ', inactive: 'Nghỉ học',
}
const STATUS_COLOR: Record<string, string> = {
  active: '#16a34a', trial: '#2563eb', paused: '#d97706', inactive: '#dc2626',
}

export const ParentDetail: React.FC<Props> = ({ parent, onClose, onEdit, onDelete, defaultTab = 'info' }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info')

  useEffect(() => {
    if (parent) {
      setActiveTab(defaultTab)
    }
  }, [parent, defaultTab])

  if (!parent) return null
  const links = parent.student_parents ?? []
  const primaryStudent = links.find(l => l.is_primary)

  return (
    <Modal open={!!parent} onClose={onClose} title="Thông tin phụ huynh" width={580}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20,
        padding: 18, background: 'var(--hover-bg)', borderRadius: 14,
      }}>
        <Avatar initials={initials(parent.full_name)} size={56} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>{parent.full_name}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 3 }}>
            {parent.gender === 'M' ? 'Nam' : parent.gender === 'F' ? 'Nữ' : 'Chưa rõ'}
            {parent.dob && ` · ${new Date(parent.dob).toLocaleDateString('vi-VN')}`}
            {parent.occupation && ` · ${parent.occupation}`}
          </div>
        </div>
        <Badge variant="primary">{links.length} con</Badge>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Tabs
          tabs={[
            { id: 'info', label: 'Thông tin chung', tooltip: 'Chi tiết hồ sơ phụ huynh' },
            { id: 'history', label: 'Lịch sử hoạt động', tooltip: 'Nhật ký đăng ký học và thanh toán học phí của con' },
          ]}
          active={activeTab}
          onChange={(t) => setActiveTab(t as 'info' | 'history')}
        />
      </div>

      {activeTab === 'info' ? (
        <>
          {/* Contact info */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              Thông tin liên lạc
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <InfoRow icon="phone" label="SĐT chính" value={parent.phone} />
              {parent.phone_secondary && <InfoRow icon="phone" label="SĐT phụ / Zalo" value={parent.phone_secondary} />}
              {parent.email && <InfoRow icon="mail" label="Email" value={parent.email} />}
              {parent.address && <InfoRow icon="map-pin" label="Địa chỉ" value={parent.address} />}
              {parent.notes && <InfoRow icon="file-text" label="Ghi chú" value={parent.notes} />}
            </div>
          </div>

          {/* Linked students */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Học viên liên kết ({links.length})
              </span>
              {primaryStudent && (
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                  <Icon name="star" size={11} style={{ verticalAlign: 'middle', color: '#f59e0b', marginRight: 3 }} />
                  Liên hệ chính: <strong>{primaryStudent.student?.full_name}</strong>
                </span>
              )}
            </div>

            {links.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', borderRadius: 10, background: 'var(--hover-bg)', color: 'var(--text-4)', fontSize: 12.5 }}>
                <Icon name="users" size={24} style={{ display: 'block', margin: '0 auto 6px', opacity: 0.4 }} />
                Chưa có học viên nào liên kết
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {links.map(link => {
                  const s = link.student
                  if (!s) return null
                  return (
                    <div key={link.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 10,
                      background: 'var(--hover-bg)',
                      border: link.is_primary ? '1.5px solid var(--primary)' : '1px solid var(--border-light)',
                    }}>
                      <Avatar initials={initials(s.full_name)} size={32} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 13 }}>
                          {s.full_name}
                          {link.is_primary && (
                            <Icon name="star" size={11}
                              style={{ marginLeft: 5, color: '#f59e0b', verticalAlign: 'middle' }} />
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 1 }}>
                          {s.level ?? 'Chưa xếp'} · {link.is_emergency ? 'Liên hệ khẩn cấp · ' : ''}{STATUS_LABEL[s.status] ?? s.status}
                        </div>
                      </div>
                      <Badge style={{ background: STATUS_COLOR[s.status] + '20', color: STATUS_COLOR[s.status] }}>
                        {RELATION_LABEL[link.relation] ?? link.relation}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, paddingTop: 14, borderTop: '1px solid var(--border-light)' }}>
            {onDelete && (
              <Button variant="danger" icon="trash" onClick={() => onDelete(parent)}>Xoá</Button>
            )}
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <Button variant="secondary" onClick={onClose}>Đóng</Button>
              {onEdit && (
                <Button icon="edit" onClick={() => onEdit(parent)}>Chỉnh sửa</Button>
              )}
            </div>
          </div>
        </>
      ) : (
        <div>
          <div style={{ maxHeight: 360, overflowY: 'auto', paddingRight: 4, marginBottom: 18 }}>
            <EntityHistoryTimeline type="parent" id={String(parent.id)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 14, borderTop: '1px solid var(--border-light)' }}>
            <Button variant="secondary" onClick={onClose}>Đóng</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
