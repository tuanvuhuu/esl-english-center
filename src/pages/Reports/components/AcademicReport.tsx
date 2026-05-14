import React, { useMemo } from 'react'
import { Card, Badge, DataGrid } from '../../../components'
import type { DataGridColumn } from '../../../components'
import { useQuery } from '../../../hooks'
import { getTests } from '../../../services'
import { KpiStat, SectionHeader, HorizontalBars, inRange, getDateRange, type RangePreset, exportCsv } from './reportShared'
import { MiniDonutChart } from '../../Dashboard/components/MiniDonutChart'
import type { DbTest } from '../../../types/database'

const TYPE_LABEL: Record<string, string> = {
  quiz:       'Quiz',
  unit_test:  'Unit Test',
  midterm:    'Giữa kỳ',
  final:      'Cuối kỳ',
  speaking:   'Speaking',
  placement:  'Xếp lớp',
}
const TYPE_COLOR: Record<string, string> = {
  quiz:      '#2563eb',
  unit_test: '#8b5cf6',
  midterm:   '#f59e0b',
  final:     '#dc2626',
  speaking:  '#ec4899',
  placement: '#0ea5e9',
}

interface Props { range: RangePreset }

export const AcademicReport: React.FC<Props> = ({ range }) => {
  const { data: tests, loading } = useQuery(getTests)
  const dateRange = useMemo(() => getDateRange(range), [range])

  const all = (tests ?? []) as DbTest[]
  const periodTests = useMemo(
    () => all.filter(t => inRange(t.test_date, dateRange)),
    [all, dateRange],
  )

  const upcoming  = all.filter(t => t.status === 'upcoming').length
  const completed = all.filter(t => t.status === 'completed').length
  const cancelled = all.filter(t => t.status === 'cancelled').length

  const byType = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of periodTests) counts[t.type] = (counts[t.type] || 0) + 1
    return counts
  }, [periodTests])

  const byClass = useMemo(() => {
    const counts: Record<string, { name: string; count: number }> = {}
    for (const t of periodTests) {
      const id = t.class?.id ?? 'unknown'
      const name = t.class?.name ?? '—'
      if (!counts[id]) counts[id] = { name, count: 0 }
      counts[id].count++
    }
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 8)
  }, [periodTests])

  const donutSegments = Object.entries(byType).map(([k, v]) => ({
    value: v, color: TYPE_COLOR[k] || '#9ca3af',
  }))

  const maxClassCount = Math.max(1, ...byClass.map(c => c.count))
  const classBars = byClass.map((c, i) => ({
    label: c.name, value: c.count, max: maxClassCount,
    color: ['#FF6B35', '#16a34a', '#2563eb', '#8b5cf6', '#f59e0b', '#ec4899'][i % 6],
    sub: `${c.count} bài`,
  }))

  const upcomingTests = useMemo(
    () => all.filter(t => t.status === 'upcoming')
      .sort((a, b) => (a.test_date ?? '').localeCompare(b.test_date ?? ''))
      .slice(0, 10),
    [all],
  )

  const cols: DataGridColumn<DbTest>[] = [
    { key: 'name', title: 'Tên bài', filterable: true, filterValue: r => r.name,
      render: r => <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{r.name}</span> },
    { key: 'class', title: 'Lớp', filterable: true, filterValue: r => r.class?.name ?? '',
      render: r => r.class?.name ?? '—' },
    { key: 'teacher', title: 'GV', filterable: true, filterValue: r => r.class?.teacher?.full_name ?? '',
      render: r => r.class?.teacher?.full_name ?? '—' },
    {
      key: 'type', title: 'Loại', filterable: true, filterType: 'select',
      filterOptions: Object.entries(TYPE_LABEL).map(([v, l]) => ({ value: v, label: l })),
      filterValue: r => r.type,
      render: r => <Badge style={{
        background: (TYPE_COLOR[r.type] ?? '#9ca3af') + '20',
        color: TYPE_COLOR[r.type] ?? '#9ca3af',
      }}>{TYPE_LABEL[r.type] ?? r.type}</Badge>,
    },
    {
      key: 'test_date', title: 'Ngày', filterValue: r => r.test_date,
      render: r => new Date(r.test_date).toLocaleDateString('vi-VN'),
    },
    {
      key: 'status', title: 'Trạng thái', filterable: true, filterType: 'select',
      filterOptions: [
        { value: 'upcoming',  label: 'Sắp tới' },
        { value: 'completed', label: 'Đã chấm' },
        { value: 'cancelled', label: 'Đã huỷ' },
      ],
      filterValue: r => r.status,
      render: r => {
        const colors = { upcoming: '#2563eb', completed: '#16a34a', cancelled: '#dc2626' }
        const labels = { upcoming: 'Sắp tới', completed: 'Đã chấm', cancelled: 'Đã huỷ' }
        const k = r.status as keyof typeof colors
        return <Badge style={{ background: colors[k] + '20', color: colors[k] }}>{labels[k]}</Badge>
      },
    },
    { key: 'total_score', title: 'Điểm tối đa', align: 'right',
      render: r => r.total_score },
  ]

  const handleExport = () => {
    exportCsv('bao-cao-hoc-tap',
      ['Tên bài', 'Lớp', 'Giáo viên', 'Loại', 'Ngày', 'Trạng thái', 'Điểm tối đa', 'Ngưỡng đạt'],
      periodTests.map(t => [
        t.name, t.class?.name ?? '', t.class?.teacher?.full_name ?? '',
        TYPE_LABEL[t.type] ?? t.type,
        new Date(t.test_date).toLocaleDateString('vi-VN'),
        t.status, t.total_score, t.pass_threshold,
      ]),
    )
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
        <KpiStat label="Tổng bài kiểm tra" value={all.length}
          sub={<span>{periodTests.length} trong kỳ</span>}
          icon="clipboard" color="#8b5cf6" bg="#ede9fe" delay={0} />
        <KpiStat label="Đã chấm" value={completed}
          sub={<span>{all.length > 0 ? Math.round((completed/all.length)*100) : 0}% hoàn thành</span>}
          icon="check" color="#16a34a" bg="#dcfce7" delay={70} />
        <KpiStat label="Sắp tới" value={upcoming}
          sub={<span>cần chuẩn bị</span>}
          icon="clock" color="#2563eb" bg="#dbeafe" delay={140} />
        <KpiStat label="Đã huỷ" value={cancelled}
          sub={<span>không tổ chức</span>}
          icon="x" color="#dc2626" bg="#fee2e2" delay={210} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: 12, marginBottom: 14 }}>
        <Card animate delay={280} style={{ padding: 18 }}>
          <SectionHeader title="Phân bố loại bài" subtitle="Trong kỳ" icon="filter" iconColor="#8b5cf6" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {donutSegments.length > 0 ? (
              <MiniDonutChart segments={donutSegments} size={120} strokeWidth={14} />
            ) : (
              <div style={{ width: 120, height: 120, borderRadius: '50%', border: '14px solid var(--hover-bg)' }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, fontSize: 11.5 }}>
              {Object.entries(TYPE_LABEL).map(([k, l]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: TYPE_COLOR[k] }} />
                  <span style={{ color: 'var(--text-3)', flex: 1 }}>{l}</span>
                  <strong style={{ color: 'var(--text-1)' }}>{byType[k] || 0}</strong>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card animate delay={350} style={{ padding: 18 }}>
          <SectionHeader title="Top lớp có nhiều bài kiểm tra" subtitle="Trong kỳ" icon="book" iconColor="#FF6B35" />
          {classBars.length > 0 ? (
            <HorizontalBars rows={classBars} labelWidth={160} />
          ) : (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-4)', fontSize: 12 }}>
              Không có bài kiểm tra trong kỳ
            </div>
          )}
        </Card>
      </div>

      {/* Upcoming */}
      {upcomingTests.length > 0 && (
        <Card animate delay={420} style={{ padding: 18, marginBottom: 14 }}>
          <SectionHeader title="Bài kiểm tra sắp tới"
            subtitle={`${upcomingTests.length} bài cần chuẩn bị`}
            icon="calendar" iconColor="#2563eb" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {upcomingTests.map(t => (
              <div key={t.id} style={{
                padding: 12, borderRadius: 9,
                background: 'var(--hover-bg)',
                borderLeft: `3px solid ${TYPE_COLOR[t.type] ?? '#9ca3af'}`,
              }}>
                <div style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--text-1)', marginBottom: 3 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                  {t.class?.name ?? '—'} · {TYPE_LABEL[t.type] ?? t.type}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>
                  📅 {new Date(t.test_date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <DataGrid<DbTest>
        title="Tất cả bài kiểm tra trong kỳ"
        subtitle={`${periodTests.length} bài`}
        data={periodTests}
        columns={cols}
        rowKey={r => r.id}
        emptyText="Không có bài kiểm tra trong kỳ này"
        loading={loading}
        defaultPageSize={20}
        exportFilename="bao-cao-hoc-tap"
        actions={
          <button onClick={handleExport}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '0 10px', height: 28,
              borderRadius: 7, border: '1px solid var(--border)', background: 'var(--card)',
              color: 'var(--text-2)', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font)', cursor: 'pointer',
            }}
          >Xuất CSV</button>
        }
      />
    </div>
  )
}
