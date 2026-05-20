import React, { useEffect, useState } from 'react'
import { getEntityHistory } from '../../services/dashboard'
import type { HistoryTimelineItem } from '../../services/dashboard'
import { LoadingSpinner } from './LoadingSpinner'
import { EmptyState } from './EmptyState'
import { Icon } from './Icon'

interface EntityHistoryTimelineProps {
  type: 'student' | 'teacher' | 'parent'
  id: string
  title?: string
}

export const EntityHistoryTimeline: React.FC<EntityHistoryTimelineProps> = ({ type, id, title }) => {
  const [history, setHistory] = useState<HistoryTimelineItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const loadHistory = async () => {
      setLoading(true)
      try {
        const data = await getEntityHistory(type, id)
        if (active) {
          setHistory(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }
    loadHistory()
    return () => {
      active = false
    }
  }, [type, id])

  if (loading) {
    return (
      <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
        <LoadingSpinner />
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div style={{ padding: '24px 0' }}>
        <EmptyState title="Không có lịch sử" desc="Chưa ghi nhận hoạt động nào của đối tượng này." />
      </div>
    )
  }

  return (
    <div style={{ padding: '8px 4px' }}>
      {title && (
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16 }}>
          {title}
        </div>
      )}
      <div style={{ position: 'relative', paddingLeft: 30, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* The vertical connector line */}
        <div style={{
          position: 'absolute', left: 11, top: 12, bottom: 12, width: 2,
          background: 'linear-gradient(to bottom, var(--border) 0%, var(--border-light) 100%)',
        }} />

        {history.map((item) => (
          <div
            key={item.id}
            className="timeline-item"
            style={{
              position: 'relative',
              transition: 'all 0.2s ease',
            }}
          >
            {/* Timeline node icon */}
            <div style={{
              position: 'absolute', left: -30, top: 2, width: 24, height: 24,
              borderRadius: '50%', background: item.bg, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 8px ${item.color}30`,
              zIndex: 2,
            }}>
              <Icon name={item.icon as any} size={11} style={{ color: item.color }} />
            </div>

            {/* Content panel */}
            <div
              style={{
                background: 'var(--hover-bg)',
                borderRadius: 12,
                padding: '12px 14px',
                border: '1px solid var(--border-light)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateX(4px)'
                e.currentTarget.style.borderColor = item.color
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.borderColor = 'var(--border-light)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>
                  {item.title}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-4)' }}>
                  {item.time}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.4 }}>
                {item.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
