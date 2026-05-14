import React, { useMemo } from 'react'
import { Card, Avatar, Badge, DataGrid } from '../../../components'
import type { DataGridColumn } from '../../../components'
import { useQuery } from '../../../hooks'
import { getStudents } from '../../../services'
import { KpiStat, HorizontalBars, SectionHeader, inRange, getDateRange, type RangePreset, exportCsv } from './reportShared'
import { MiniDonutChart } from '../../Dashboard/components/MiniDonutChart'
import type { DbStudent } from '../../../types/database'

const STATUS_LABEL: Record<string, string> = {
  active:   'Đang học',
  trial:    'Học thử',
  paused:   'Tạm nghỉ',
  inactive: 'Nghỉ học',
}
const STATUS_COLOR: Record<string, string> = {
  active:   '#16a34a',
  trial:    '#2563eb',
  paused:   '#d97706',
  inactive: '#dc2626',
}

interface Props { range: RangePreset }

export const StudentReport: React.FC<Props> = ({ range }) => {
  const { data: students, loading } = useQuery(getStudents)
  const dateRange = useMemo(() => getDateRange(range), [range])

  const all = (students ?? []) as DbStudent[]

  const byStatus = useMemo(() => {
    const counts: Record<string, number> = { active: 0, trial: 0, paused: 0, inactive: 0 }
    for (const s of all) counts[s.status] = (counts[s.status] || 0) + 1
    return counts
  }, [all])

  const byLevel = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of all) {
      const lv = s.level || 'Chưa xếp'
      map[lv] = (map[lv] || 0) + 1
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [all])

  const byGender = useMemo(() => {
    const m = all.filter(s => s.gender === 'M').length
    const f = all.filter(s => s.gender === 'F').length
    const u = all.length - m - f
    return { male: m, female: f, unknown: u }
  }, [all])

  const newInRange = useMemo(
    () => all.filter(s => inRange(s.enroll_date, dateRange)).sort((a, b) =>
      (b.enroll_date ?? '').localeCompare(a.enroll_date ?? '')),
    [all, dateRange],
  )

  const retentionRate = all.length > 0
    ? Math.round((byStatus.active / (all.length - (byStatus.trial || 0) || 1)) * 100)
    : 0

  const donutSegments = [
    { value: byStatus.active   || 0, color: STATUS_COLOR.active   },
    { value: byStatus.trial    || 0, color: STATUS_COLOR.trial    },
    { value: byStatus.paused   || 0, color: STATUS_COLOR.paused   },
    { value: byStatus.inactive || 0, color: STATUS_COLOR.inactive },
  ].filter(s => s.value > 0)

  const maxLevel = Math.max(1, ...byLevel.map(([, v]) => v))
  const levelBars = byLevel.map(([label, value], i) => ({
    label,
    value,
    max: maxLevel,
    color: ['#FF6B35', '#16a34a', '#2563eb', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16'][i % 8],
    sub: String(value),
  }))

  const cols: DataGridColumn<DbStudent>[] = [
    {
      key: 'name', title: 'Học viên', filterable: true,
      filterValue: r => r.full_name,
      render: r => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar initials={r.full_name[0]} size={28} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--text-1)' }}>{r.full_name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-4)' }}>
              {r.gender === 'M' ? 'Nam' : r.gender === 'F' ? 'Nữ' : '—'}
              {r.dob && ` · ${new Date(r.dob).getFullYear()}`}
            </div>
          </div>
        </div>
      ),
    },
    { key: 'level',  title: 'Trình độ', filterable: true, filterValue: r => r.level ?? '—', render: r => r.level || '—' },
    { key: 'phone',  title: 'SĐT',      render: r => r.phone || '—' },
    {
      key: 'enroll_date', title: 'Ngày nhập học',
      filterValue: r => r.enroll_date ?? '',
      render: r => r.enroll_date ? new Date(r.enroll_date).toLocaleDateString('vi-VN') : '—',
    },
    {
      key: 'status', title: 'Trạng thái',
      filterable: true, filterType: 'select',
      filterOptions: Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })),
      filterValue: r => r.status,
      render: r => (
        <Badge style={{ background: STATUS_COLOR[r.status] + '20', color: STATUS_COLOR[r.status] }}>
          {STATUS_LABEL[r.status]}
        </Badge>
      ),
    },
  ]

  const handleExport = () => {
    exportCsv('bao-cao-hoc-vien',
      ['Họ tên', 'Giới tính', 'Năm sinh', 'Trình độ', 'SĐT', 'Email', 'Ngày nhập học', 'Trạng thái'],
      all.map(s => [
        s.full_name,
        s.gender === 'M' ? 'Nam' : s.gender === 'F' ? 'Nữ' : '',
        s.dob ? new Date(s.dob).getFullYear() : '',
        s.level ?? '',
        s.phone ?? '',
        s.email ?? '',
        s.enroll_date ? new Date(s.enroll_date).toLocaleDateString('vi-VN') : '',
        STATUS_LABEL[s.status] ?? s.status,
      ]),
    )
  }

  return (
    <div>
      {/* ── KPI ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
        <KpiStat label="Tổng học viên" value={all.length}
          sub={<span>{byGender.male} nam · {byGender.female} nữ</span>}
          icon="users" color="#FF6B35" bg="var(--primary-light)" delay={0} />
        <KpiStat label="Đang học" value={byStatus.active || 0}
          sub={<span>{all.length > 0 ? Math.round(((byStatus.active||0)/all.length)*100) : 0}% trên tổng</span>}
          icon="check" color="#16a34a" bg="#dcfce7" delay={70} />
        <KpiStat label="Học thử" value={byStatus.trial || 0}
          sub={<span>chờ chuyển chính thức</span>}
          icon="star" color="#2563eb" bg="#dbeafe" delay={140} />
        <KpiStat label="Đăng ký mới (kỳ này)" value={newInRange.length}
          sub={<span>theo bộ lọc thời gian</span>}
          icon="plus-circle" color="#8b5cf6" bg="#ede9fe" delay={210} />
        <KpiStat label="Tỷ lệ giữ chân" value={retentionRate + '%'}
          sub={<span>active / (active+nghỉ)</span>}
          icon="trending-up" color="#0ea5e9" bg="#e0f2fe" delay={280} />
      </div>

      {/* ── Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: 12, marginBottom: 14 }}>
        <Card animate delay={350} style={{ padding: 18 }}>
          <SectionHeader title="Phân bố trạng thái" icon="user" iconColor="#FF6B35" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {donutSegments.length > 0 ? (
              <MiniDonutChart segments={donutSegments} size={130} strokeWidth={16} />
            ) : (
              <div style={{ width: 130, height: 130, borderRadius: '50%', border: '16px solid var(--hover-bg)' }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              {Object.entries(STATUS_LABEL).map(([key, label]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: STATUS_COLOR[key] }} />
                  <span style={{ color: 'var(--text-3)', flex: 1 }}>{label}</span>
                  <strong style={{ color: 'var(--text-1)', fontWeight: 700 }}>{byStatus[key] || 0}</strong>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card animate delay={420} style={{ padding: 18 }}>
          <SectionHeader title="Phân bố theo trình độ" subtitle={`${byLevel.length} cấp độ`} icon="award" iconColor="#8b5cf6" />
          {levelBars.length > 0 ? (
            <HorizontalBars rows={levelBars} />
          ) : (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-4)', fontSize: 12 }}>Chưa có dữ liệu</div>
          )}
        </Card>
      </div>

      {/* ── Table ── */}
      <DataGrid<DbStudent>
        title="Danh sách học viên đăng ký mới"
        subtitle={`${newInRange.length} học viên trong kỳ`}
        data={newInRange}
        columns={cols}
        rowKey={r => r.id}
        emptyText="Không có học viên đăng ký mới trong kỳ này"
        loading={loading}
        defaultPageSize={20}
        exportFilename="hoc-vien-moi"
        actions={
          <button
            onClick={handleExport}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '0 10px', height: 28,
              borderRadius: 7, border: '1px solid var(--border)', background: 'var(--card)',
              color: 'var(--text-2)', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font)', cursor: 'pointer',
            }}
          >Xuất tất cả CSV</button>
        }
      />
    </div>
  )
}
