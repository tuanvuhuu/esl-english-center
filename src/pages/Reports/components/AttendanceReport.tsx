import React, { useEffect, useMemo, useState } from 'react'
import { Card, Badge, DataGrid, Icon } from '../../../components'
import type { DataGridColumn } from '../../../components'
import { useQuery } from '../../../hooks'
import { getClasses } from '../../../services'
import { getClassAttendanceStats } from '../../../services/attendance'
import { KpiStat, SectionHeader, HorizontalBars, getDateRange, type RangePreset, exportCsv } from './reportShared'

interface Props { range: RangePreset }

interface ClassRow {
  id: string
  name: string
  level: string | null
  teacher: string
  totalSessions: number
  present: number
  late: number
  excused: number
  absent: number
  rate: number
}

export const AttendanceReport: React.FC<Props> = ({ range }) => {
  const { data: classes, loading: cLoading } = useQuery(() => getClasses({ status: 'active' }))
  const dateRange = useMemo(() => getDateRange(range), [range])

  const [rows, setRows] = useState<ClassRow[]>([])
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    if (!classes) return
    const list = classes as any[]
    const from = dateRange?.from
      ? dateRange.from.toISOString().slice(0, 10)
      : '2020-01-01'
    const to = (dateRange?.to ?? new Date()).toISOString().slice(0, 10)

    setStatsLoading(true)
    Promise.all(list.map(async (c) => {
      try {
        const s = await getClassAttendanceStats(c.id, from, to)
        return {
          id: c.id, name: c.name, level: c.level ?? null,
          teacher: c.teacher?.full_name ?? '—',
          totalSessions: s.totalSessions,
          present: s.presentCount, late: s.lateCount,
          excused: s.excusedCount, absent: s.absentCount,
          rate: s.rate,
        } as ClassRow
      } catch {
        return null
      }
    })).then(results => {
      setRows(results.filter((r): r is ClassRow => !!r))
      setStatsLoading(false)
    })
  }, [classes, dateRange])

  const totalSessions = rows.reduce((s, r) => s + r.totalSessions, 0)
  const totalPresent = rows.reduce((s, r) => s + r.present + r.late, 0)
  const totalAbsent = rows.reduce((s, r) => s + r.absent, 0)
  const avgRate = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.rate, 0) / rows.length) : 0
  const riskyClasses = rows.filter(r => r.rate < 70 && r.totalSessions > 0).length

  /* Sorted classes for bar chart */
  const topClasses = useMemo(() => {
    return [...rows]
      .filter(r => r.totalSessions > 0)
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 8)
  }, [rows])

  const worstClasses = useMemo(() => {
    return [...rows]
      .filter(r => r.totalSessions > 0)
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 5)
  }, [rows])

  const topBars = topClasses.map(c => ({
    label: c.name, value: c.rate, max: 100,
    color: c.rate >= 90 ? '#16a34a' : c.rate >= 75 ? '#0ea5e9' : '#d97706',
    sub: `${c.rate}%`,
  }))

  const cols: DataGridColumn<ClassRow>[] = [
    { key: 'name', title: 'Lớp', filterable: true, filterValue: r => r.name,
      render: r => <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{r.name}</span> },
    { key: 'level', title: 'Trình độ', filterable: true, filterValue: r => r.level ?? '—',
      render: r => r.level || '—' },
    { key: 'teacher', title: 'Giáo viên', filterable: true, filterValue: r => r.teacher,
      render: r => r.teacher },
    { key: 'totalSessions', title: 'Tổng lượt', align: 'right',
      render: r => r.totalSessions },
    { key: 'present', title: 'Có mặt', align: 'right',
      render: r => <span style={{ color: '#16a34a', fontWeight: 600 }}>{r.present}</span> },
    { key: 'late', title: 'Muộn', align: 'right',
      render: r => <span style={{ color: '#d97706', fontWeight: 600 }}>{r.late}</span> },
    { key: 'excused', title: 'Vắng phép', align: 'right',
      render: r => <span style={{ color: '#2563eb', fontWeight: 600 }}>{r.excused}</span> },
    { key: 'absent', title: 'Vắng', align: 'right',
      render: r => <span style={{ color: '#dc2626', fontWeight: 600 }}>{r.absent}</span> },
    { key: 'rate', title: 'Tỷ lệ', align: 'right',
      render: r => (
        <Badge style={{
          background: r.rate >= 90 ? '#dcfce7' : r.rate >= 75 ? '#dbeafe' : r.rate >= 60 ? '#fef3c7' : '#fee2e2',
          color:      r.rate >= 90 ? '#16a34a' : r.rate >= 75 ? '#2563eb' : r.rate >= 60 ? '#d97706' : '#dc2626',
        }}>{r.rate}%</Badge>
      )
    },
  ]

  const handleExport = () => {
    exportCsv('bao-cao-diem-danh',
      ['Lớp', 'Trình độ', 'Giáo viên', 'Tổng lượt', 'Có mặt', 'Muộn', 'Vắng phép', 'Vắng', 'Tỷ lệ chuyên cần'],
      rows.map(r => [r.name, r.level ?? '', r.teacher, r.totalSessions, r.present, r.late, r.excused, r.absent, r.rate + '%']),
    )
  }

  return (
    <div>
      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
        <KpiStat label="Tổng lượt điểm danh" value={totalSessions}
          sub={<span>{rows.length} lớp đang hoạt động</span>}
          icon="clipboard" color="#2563eb" bg="#dbeafe" delay={0} />
        <KpiStat label="Tỷ lệ chuyên cần TB" value={avgRate + '%'}
          sub={
            <div style={{ height: 4, borderRadius: 99, background: 'var(--border)', overflow: 'hidden', marginTop: 4 }}>
              <div style={{ height: '100%', width: `${avgRate}%`,
                background: avgRate >= 80 ? '#16a34a' : avgRate >= 60 ? '#d97706' : '#dc2626',
                borderRadius: 99, transition: 'width 0.5s' }} />
            </div>
          }
          icon="trending-up" color="#16a34a" bg="#dcfce7" delay={70} />
        <KpiStat label="Lượt vắng" value={totalAbsent}
          sub={<span>{totalSessions > 0 ? Math.round((totalAbsent/totalSessions)*100) : 0}% tổng lượt</span>}
          icon="x" color="#dc2626" bg="#fee2e2" delay={140} />
        <KpiStat label="Lớp nguy cơ" value={riskyClasses}
          sub={<span>tỷ lệ &lt; 70%</span>}
          icon="alert" color="#d97706" bg="#fef3c7" delay={210} />
        <KpiStat label="Có mặt + Muộn" value={totalPresent}
          sub={<span>tổng số lượt tham gia</span>}
          icon="check" color="#0ea5e9" bg="#e0f2fe" delay={280} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12, marginBottom: 14 }}>
        <Card animate delay={350} style={{ padding: 18 }}>
          <SectionHeader title="Top lớp chuyên cần"
            subtitle="Sắp xếp theo tỷ lệ cao nhất"
            icon="award" iconColor="#16a34a" />
          {topBars.length > 0 ? (
            <HorizontalBars rows={topBars} labelWidth={140} />
          ) : (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-4)', fontSize: 12 }}>
              {statsLoading ? 'Đang tính toán...' : 'Chưa có dữ liệu điểm danh'}
            </div>
          )}
        </Card>

        <Card animate delay={420} style={{ padding: 18 }}>
          <SectionHeader title="Lớp cần chú ý"
            subtitle="Tỷ lệ chuyên cần thấp nhất"
            icon="alert-circle" iconColor="#dc2626" />
          {worstClasses.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {worstClasses.map((c, i) => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '8px 12px', borderRadius: 8,
                  background: c.rate < 60 ? '#fee2e2' : c.rate < 75 ? '#fef3c7' : 'var(--hover-bg)',
                  border: `1px solid ${c.rate < 60 ? '#fecaca' : 'transparent'}`,
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', width: 18 }}>#{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--text-1)' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 1 }}>
                      {c.teacher} · {c.absent} vắng / {c.totalSessions} lượt
                    </div>
                  </div>
                  <span style={{
                    fontSize: 14, fontWeight: 800,
                    color: c.rate < 60 ? '#dc2626' : c.rate < 75 ? '#d97706' : '#16a34a',
                  }}>{c.rate}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-4)', fontSize: 12 }}>
              <Icon name="check" size={24} style={{ color: '#16a34a', display: 'block', margin: '0 auto 6px' }} />
              Tất cả lớp đều ổn!
            </div>
          )}
        </Card>
      </div>

      {/* Table */}
      <DataGrid<ClassRow>
        title="Chi tiết theo lớp"
        subtitle={`${rows.length} lớp · từ ${dateRange?.from?.toLocaleDateString('vi-VN') ?? 'đầu thời gian'} đến ${(dateRange?.to ?? new Date()).toLocaleDateString('vi-VN')}`}
        data={rows}
        columns={cols}
        rowKey={r => r.id}
        emptyText="Chưa có dữ liệu điểm danh"
        loading={cLoading || statsLoading}
        defaultPageSize={20}
        exportFilename="diem-danh-theo-lop"
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
