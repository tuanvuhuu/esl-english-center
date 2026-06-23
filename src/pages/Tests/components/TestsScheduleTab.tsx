import React, { useMemo, useState } from 'react'
import { Card, Badge, Button, Icon, Input, Select } from '../../../components'
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

const TYPE_COLORS: Record<TestType, string> = {
  quiz:       'var(--info)',
  unit_test:  'var(--text-4)',
  midterm:    'var(--warning)',
  final:      'var(--error)',
  speaking:   'var(--primary)',
  placement:  'var(--success)',
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
  search: string
  onSearchChange: (val: string) => void
  typeFilter: string
  onTypeFilterChange: (val: string) => void
  statusFilter: string
  onStatusFilterChange: (val: string) => void
  onSelectTest: (test: DbTest) => void
  onCreate: () => void
  onBuildQuestions?: (test: DbTest) => void
  onExportPdf?: (test: DbTest) => Promise<void>
  onViewPdf?: (test: DbTest) => void
  onTakeOnline?: (test: DbTest) => void
}

export const TestsScheduleTab: React.FC<TestsScheduleTabProps> = ({
  tests, loading,
  search, onSearchChange,
  typeFilter, onTypeFilterChange,
  statusFilter, onStatusFilterChange,
  onSelectTest, onCreate, onBuildQuestions, onExportPdf, onViewPdf, onTakeOnline
}) => {
  const [exportingId, setExportingId] = useState<string | null>(null);

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
    const leftBorderColor = TYPE_COLORS[t.type] || 'var(--text-4)'

    return (
      <Card
        key={t.id}
        hover
        animate
        delay={i * 50}
        style={{
          cursor: 'pointer',
          borderLeft: `4px solid ${leftBorderColor}`,
          padding: '12px 14px',
          paddingLeft: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 10,
        }}
        onClick={() => onSelectTest(t)}
      >
        <div>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Badge variant={TYPE_VARIANTS[t.type]} style={{ padding: '1px 6px', fontSize: 10 }}>
                {TYPE_LABELS[t.type]}
              </Badge>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
                {t.class?.name ?? '—'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {isUpcoming && days >= 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 10,
                  fontWeight: 700,
                  color: days === 0 ? 'var(--error-text)' : days <= 3 ? 'var(--warning-text)' : 'var(--text-3)',
                  background: days === 0 ? 'var(--error-bg)' : days <= 3 ? 'var(--warning-bg)' : 'var(--border-light)',
                  padding: '1px 6px',
                  borderRadius: '100px',
                }}>
                  <Icon name="clock" size={10} />
                  {days === 0 ? 'Hôm nay' : `${days} ngày`}
                </div>
              )}
              <Badge variant={isUpcoming ? 'warning' : 'success'} style={{ padding: '1px 6px', fontSize: 10 }}>
                {isUpcoming ? 'Sắp tới' : 'Xong'}
              </Badge>
            </div>
          </div>

          {/* Name */}
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6, lineHeight: 1.25 }}>
            {t.name}
          </div>

          {/* Teacher and Date in a single row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, fontSize: 11, color: 'var(--text-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="calendar" size={12} style={{ color: 'var(--text-4)' }} />
              <span>{fmtDate(t.test_date)}</span>
            </div>
            {t.class?.teacher && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="graduation" size={12} style={{ color: 'var(--text-4)' }} />
                <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.class.teacher.full_name}>
                  {t.class.teacher.full_name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{
          paddingTop: 8,
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
        }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', gap: 4 }}>
            {isUpcoming && onBuildQuestions && (
              <Button
                variant="outline"
                size="sm"
                icon="list"
                onClick={() => onBuildQuestions(t)}
                style={{ padding: '2px 8px', height: 24, fontSize: 11 }}
              >
                Câu hỏi
              </Button>
            )}
            {isUpcoming && onTakeOnline && (
              <Button
                variant="primary"
                size="sm"
                icon="zap"
                onClick={() => onTakeOnline(t)}
                style={{ padding: '2px 8px', height: 24, fontSize: 11 }}
              >
                Online
              </Button>
            )}
            {t.status === 'completed' && (
              <Button
                variant="outline"
                size="sm"
                icon="bar-chart-2"
                onClick={() => onSelectTest(t)}
                style={{ color: 'var(--info-text)', borderColor: 'var(--info-border)', padding: '2px 8px', height: 24, fontSize: 11 }}
              >
                Kết quả
              </Button>
            )}
          </div>

          <div style={{ display: 'inline-flex', gap: 4 }}>
            {onViewPdf && (
              <Button
                variant="secondary"
                size="sm"
                icon="eye"
                title="Xem PDF"
                onClick={() => onViewPdf(t)}
                style={{ width: 24, height: 24, padding: 0 }}
              >
                {null}
              </Button>
            )}
            {onExportPdf && (
              <Button
                variant="secondary"
                size="sm"
                icon="download"
                title="Tải PDF"
                loading={exportingId === t.id}
                onClick={async () => {
                  setExportingId(t.id);
                  await onExportPdf(t);
                  setExportingId(null);
                }}
                style={{ width: 24, height: 24, padding: 0 }}
              >
                {null}
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
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <Input
            placeholder="Tìm tên bài, tên lớp..."
            value={search}
            onChange={onSearchChange}
            icon="search"
          />
        </div>

        <Select
          value={typeFilter}
          onChange={onTypeFilterChange}
          options={[
            { value: '', label: 'Tất cả loại' },
            ...Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))
          ]}
          style={{ minWidth: 160 }}
        />

        <Select
          value={statusFilter}
          onChange={onStatusFilterChange}
          options={[
            { value: '', label: 'Tất cả trạng thái' },
            { value: 'upcoming', label: 'Sắp tới' },
            { value: 'completed', label: 'Hoàn thành' }
          ]}
          style={{ minWidth: 160 }}
        />

        <Button variant="primary" icon="plus" onClick={onCreate}>
          Tạo bài kiểm tra
        </Button>
      </div>

      {/* Upcoming section */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Sắp tới · {upcoming.length}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
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
