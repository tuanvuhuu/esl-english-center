import React from 'react'
import { Card, Icon, Badge, StatusBadge, EmptyState } from '../../../components'
import type { Class } from '../../../types/data'

interface ClassGridProps {
  classes: Class[]
  onSelectClass: (c: Class) => void
  onEdit?: (c: Class) => void
  onDelete?: (c: Class) => void
}

const LVL_C: Record<string, string> = { A1: '#FF6B35', A2: '#3B82F6', B1: '#10B981', B2: '#8B5CF6', 'B2+': '#8B5CF6', 'A1-A2': '#F59E0B' }

export const ClassGrid: React.FC<ClassGridProps> = ({ classes, onSelectClass, onEdit, onDelete }) => {
  if (classes.length === 0) return <EmptyState icon="book" title="Không tìm thấy lớp học" desc="Thử thay đổi bộ lọc" />
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
      {classes.map((c, i) => {
        const pct = Math.round((c.students / c.maxStudents) * 100)
        const barColor = pct > 85 ? '#EF4444' : pct > 60 ? '#F59E0B' : '#10B981'
        return (
          <Card key={c.id} hover animate delay={i * 60} onClick={() => onSelectClass(c)}
            style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: LVL_C[c.level] || 'var(--text-4)' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 4 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{c.ageGroup || 'N/A'} tuổi · {c.level}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Badge variant={pct > 85 ? 'error' : pct > 60 ? 'warning' : 'success'} style={{ fontSize: 11 }}>
                  {c.students}/{c.maxStudents}
                </Badge>
                <StatusBadge status={c.status} />
              </div>
            </div>
            <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, marginBottom: 12, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3, transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="graduation" size={13} style={{ color: LVL_C[c.level], flexShrink: 0 }} />
                {c.teacher || 'Chưa phân công'}
              </div>
              {(c.assistantNames?.length ?? 0) > 0 && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <Icon name="users" size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{c.assistantNames!.join(', ')}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="calendar" size={13} />{c.schedule || 'Chưa có lịch'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="building" size={13} />{c.room || '—'} · {c.fee || 'Miễn phí'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
              {onEdit && (
                <button onClick={() => onEdit(c)} title="Chỉnh sửa"
                  style={{ background: 'var(--hover-bg)', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '4px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: 'var(--font)' }}>
                  <Icon name="edit" size={13} /> Sửa
                </button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(c)} title="Xoá"
                  style={{ background: 'var(--hover-bg)', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '4px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: 'var(--font)' }}>
                  <Icon name="trash" size={13} /> Xoá
                </button>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
