import React from 'react'
import { Card, Avatar, Badge, StatusBadge, Icon, EmptyState } from '../../../components'
import type { Teacher } from '../../../types/data'

interface TeacherGridProps {
  teachers: Teacher[]
  onSelectTeacher: (t: Teacher) => void
  onEdit?: (t: Teacher) => void
  onDelete?: (t: Teacher) => void
}

export const TeacherGrid: React.FC<TeacherGridProps> = ({ teachers, onSelectTeacher, onEdit, onDelete }) => {
  if (teachers.length === 0) return <EmptyState icon="graduation" title="Không tìm thấy giáo viên" desc="Thử thay đổi bộ lọc" />
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
      {teachers.map((t, i) => (
        <Card key={t.id} hover animate delay={i * 60} onClick={() => onSelectTeacher(t)} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <Avatar initials={t.avatar || t.name[0]} size={48} color={t.color} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{t.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Icon name="map-pin" size={11} />{t.nationality || '—'}
              </div>
            </div>
            <StatusBadge status={t.status} type="teacher" />
          </div>

          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
            {t.subjects?.map(s => <Badge key={s} variant="info" style={{ fontSize: 11 }}>{s}</Badge>)}
            {(!t.subjects || t.subjects.length === 0) && <span style={{ fontSize: 12, color: 'var(--text-4)' }}>Chưa có môn</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 12, fontSize: 12, color: 'var(--text-3)' }}>
            <Icon name="map-pin" size={12} style={{ marginTop: 2, flexShrink: 0 }} />
            {t.branches && t.branches.length > 0
              ? <span style={{ lineHeight: 1.5 }}>{t.branches.join(' · ')}</span>
              : <span style={{ color: 'var(--text-4)' }}>Chưa có cơ sở</span>
            }
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', borderTop: '1px solid var(--border-light)', fontSize: 12, color: 'var(--text-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="phone" size={12} />{t.phone || '—'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <Icon name="mail" size={12} />{t.email || '—'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 10 }} onClick={e => e.stopPropagation()}>
            {onEdit && (
              <button onClick={() => onEdit(t)} title="Chỉnh sửa"
                style={{ background: 'var(--hover-bg)', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '4px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: 'var(--font)' }}>
                <Icon name="edit" size={13} /> Sửa
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(t)} title="Xoá"
                style={{ background: 'var(--hover-bg)', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '4px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: 'var(--font)' }}>
                <Icon name="trash" size={13} /> Xoá
              </button>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
