import React, { useMemo, useState } from 'react'
import { Card, Badge, Button, Icon } from '../../../components'
import type { DbTest, TestType } from '../../../types/database'

const TYPE_LABELS: Record<TestType, string> = {
  quiz:       'Quiz',
  unit_test:  'Unit Test',
  midterm:    'Giữa kỳ',
  final:      'Cuối kỳ',
  speaking:   'Nói',
  placement:  'Xếp lớp',
}

const TYPE_VARIANTS: Record<TestType, 'primary' | 'info' | 'warning' | 'error' | 'default' | 'success'> = {
  quiz:       'info',
  unit_test:  'default',
  midterm:    'warning',
  final:      'error',
  speaking:   'primary',
  placement:  'success',
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function daysUntil(dateStr: string) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const d = new Date(dateStr)
  const diff = Math.round((d.getTime() - now.getTime()) / 86400000)
  return diff
}

interface TestsScheduleTabProps {
  tests: DbTest[]
  loading: boolean
  onSelectTest: (test: DbTest) => void
  onCreate: () => void
  onBuildQuestions?: (test: DbTest) => void
  onExportPdf?: (test: DbTest) => Promise<void>
  onViewPdf?: (test: DbTest) => void
  onTakeOnline?: (test: DbTest) => void
}

export const TestsScheduleTab: React.FC<TestsScheduleTabProps> = ({
  tests, loading, onSelectTest, onCreate, onBuildQuestions, onExportPdf, onViewPdf, onTakeOnline
}) => {
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(() => {
    return tests.filter(t => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase()) &&
          !(t.class?.name ?? '').toLowerCase().includes(search.toLowerCase())) return false
      if (typeFilter && t.type !== typeFilter) return false
      if (statusFilter && t.status !== statusFilter) return false
      return true
    })
  }, [tests, search, typeFilter, statusFilter])

  const upcoming = filtered.filter(t => t.status === 'upcoming')
  const completed = filtered.filter(t => t.status === 'completed')

  const selectStyle: React.CSSProperties = {
    height: 32,
    padding: '0 10px',
    borderRadius: 8,
    fontSize: 13,
    border: '1px solid var(--border)',
    background: 'var(--card-bg)',
    color: 'var(--text-2)',
    cursor: 'pointer',
    fontFamily: 'var(--font)',
    outline: 'none',
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
        Đang tải...
      </div>
    )
  }

  const renderTestCard = (t: DbTest, i: number) => {
    const days = daysUntil(t.test_date)
    const isUpcoming = t.status === 'upcoming'

    return (
      <Card
        key={t.id}
        hover
        animate
        delay={i * 50}
        style={{ cursor: 'pointer' }}
        onClick={() => onSelectTest(t)}
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Badge variant={TYPE_VARIANTS[t.type]}>{TYPE_LABELS[t.type]}</Badge>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isUpcoming && days >= 0 && (
              <span style={{ fontSize: 11, color: days <= 3 ? 'var(--warning-dark)' : 'var(--text-4)' }}>
                {days === 0 ? 'Hôm nay' : `${days} ngày nữa`}
              </span>
            )}
            <Badge variant={isUpcoming ? 'warning' : 'success'}>
              {isUpcoming ? 'Sắp tới' : 'Hoàn thành'}
            </Badge>
          </div>
        </div>

        {/* Name */}
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>
          {t.name}
        </div>

        {/* Class */}
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12 }}>
          {t.class?.name ?? '—'}
          {t.class?.teacher && ` · ${t.class.teacher.full_name}`}
        </div>

        {/* Footer */}
        <div style={{
          paddingTop: 10,
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {/* Row 1: date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-3)' }}>
            <Icon name="calendar" size={14} />
            {fmtDate(t.test_date)}
          </div>

          {/* Row 2: actions */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {isUpcoming && onBuildQuestions && (
              <Button
                variant="ghost"
                size="sm"
                icon="list"
                onClick={e => { e.stopPropagation(); onBuildQuestions(t) }}
                style={{ color: 'var(--primary)', fontWeight: 700 }}
              >
                Câu hỏi
              </Button>
            )}
            {isUpcoming && onTakeOnline && (
              <Button
                variant="ghost"
                size="sm"
                icon="zap"
                onClick={e => { e.stopPropagation(); onTakeOnline(t) }}
                style={{ color: 'var(--success)', fontWeight: 700 }}
              >
                Làm online
              </Button>
            )}
            {onViewPdf && (
              <Button
                variant="ghost"
                size="sm"
                icon="eye"
                onClick={e => { e.stopPropagation(); onViewPdf(t) }}
              >
                Xem PDF
              </Button>
            )}
            {onExportPdf && (
              <Button
                variant="ghost"
                size="sm"
                icon="download"
                loading={exportingId === t.id}
                onClick={async (e) => {
                  e.stopPropagation();
                  setExportingId(t.id);
                  await onExportPdf(t);
                  setExportingId(null);
                }}
              >
                In PDF
              </Button>
            )}
            {t.status === 'completed' && (
              <Button
                variant="ghost"
                size="sm"
                icon="bar-chart-2"
                onClick={e => { e.stopPropagation(); onSelectTest(t) }}
              >
                Kết quả
              </Button>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Icon
            name="search"
            size={14}
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }}
          />
          <input
            style={{
              width: '100%', height: 32, paddingLeft: 30, paddingRight: 10,
              borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--card-bg)', color: 'var(--text-1)',
              fontSize: 13, fontFamily: 'var(--font)', outline: 'none',
              boxSizing: 'border-box',
            }}
            placeholder="Tìm tên bài, tên lớp..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select style={selectStyle} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">Tất cả loại</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <select style={selectStyle} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="upcoming">Sắp tới</option>
          <option value="completed">Hoàn thành</option>
        </select>

        <Button variant="primary" icon="plus" size="md" onClick={onCreate}>
          Tạo bài kiểm tra
        </Button>
      </div>

      {/* Upcoming section */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Sắp tới · {upcoming.length}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {upcoming.map((t, i) => renderTestCard(t, i))}
          </div>
        </div>
      )}

      {/* Completed section */}
      {completed.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Đã hoàn thành · {completed.length}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {completed.map((t, i) => renderTestCard(t, i))}
          </div>
        </div>
      )}

      {/* Empty */}
      {filtered.length === 0 && (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <Icon name="clipboard" size={40} style={{ color: 'var(--text-4)', display: 'block', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
            Chưa có bài kiểm tra nào
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-4)', marginBottom: 16 }}>
            {search || typeFilter || statusFilter
              ? 'Không tìm thấy kết quả phù hợp với bộ lọc.'
              : 'Tạo bài kiểm tra đầu tiên để bắt đầu theo dõi kết quả học viên.'}
          </div>
          {!search && !typeFilter && !statusFilter && (
            <Button variant="primary" icon="plus" onClick={onCreate}>
              Tạo bài kiểm tra
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
