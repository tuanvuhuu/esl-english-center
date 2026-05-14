import React, { useMemo } from 'react'
import { Card, Avatar, Badge, DataGrid } from '../../../components'
import type { DataGridColumn } from '../../../components'
import { useQuery } from '../../../hooks'
import { getTeachers, getClasses } from '../../../services'
import { KpiStat, SectionHeader, HorizontalBars, type RangePreset, exportCsv } from './reportShared'
import type { DbTeacher, DbClass } from '../../../types/database'

const STATUS_LABEL: Record<string, string> = {
  active: 'Đang dạy', 'on-leave': 'Nghỉ phép', inactive: 'Nghỉ việc',
}
const STATUS_COLOR: Record<string, string> = {
  active: '#16a34a', 'on-leave': '#d97706', inactive: '#dc2626',
}

interface TeacherStat {
  teacher: DbTeacher
  classCount: number
  studentCount: number
  hoursPerWeek: number
  classes: string[]
}

interface Props { range: RangePreset }

export const TeacherReport: React.FC<Props> = ({ range: _range }) => {
  const { data: teachers, loading: tLoading } = useQuery(getTeachers)
  const { data: classes,  loading: cLoading } = useQuery(() => getClasses())

  const stats = useMemo<TeacherStat[]>(() => {
    const allT = (teachers ?? []) as DbTeacher[]
    const allC = (classes ?? []) as DbClass[]

    return allT.map(t => {
      const myClasses = allC.filter(c => c.teacher_id === t.id && c.status === 'active')
      const studentCount = myClasses.reduce((s, c) => s + (c.enrollments?.length ?? 0), 0)
      let hoursPerWeek = 0
      for (const c of myClasses) {
        for (const sch of c.class_schedules ?? []) {
          const [sh, sm] = (sch.start_time ?? '00:00').split(':').map(Number)
          const [eh, em] = (sch.end_time   ?? '00:00').split(':').map(Number)
          const mins = (eh * 60 + em) - (sh * 60 + sm)
          if (mins > 0) hoursPerWeek += mins / 60
        }
      }
      return {
        teacher: t,
        classCount: myClasses.length,
        studentCount,
        hoursPerWeek: Math.round(hoursPerWeek * 10) / 10,
        classes: myClasses.map(c => c.name),
      }
    })
  }, [teachers, classes])

  const allT = (teachers ?? []) as DbTeacher[]
  const active   = allT.filter(t => t.status === 'active').length
  const onLeave  = allT.filter(t => t.status === 'on-leave').length
  const inactive = allT.filter(t => t.status === 'inactive').length

  const totalClassCount = stats.reduce((s, t) => s + t.classCount, 0)
  const totalHours = stats.reduce((s, t) => s + t.hoursPerWeek, 0)
  const avgHours = active > 0 ? Math.round((totalHours / active) * 10) / 10 : 0

  const topByLoad = useMemo(() =>
    [...stats]
      .filter(s => s.teacher.status === 'active')
      .sort((a, b) => b.hoursPerWeek - a.hoursPerWeek)
      .slice(0, 8),
    [stats],
  )

  const maxHours = Math.max(1, ...topByLoad.map(s => s.hoursPerWeek))
  const loadBars = topByLoad.map(s => ({
    label: s.teacher.full_name,
    value: s.hoursPerWeek,
    max: maxHours,
    color: s.hoursPerWeek > avgHours * 1.3 ? '#dc2626'
         : s.hoursPerWeek > avgHours       ? '#d97706'
         : s.hoursPerWeek < avgHours * 0.5 ? '#0ea5e9'
         : '#16a34a',
    sub: `${s.hoursPerWeek}h/tuần`,
  }))

  const cols: DataGridColumn<TeacherStat>[] = [
    {
      key: 'name', title: 'Giáo viên', filterable: true,
      filterValue: r => r.teacher.full_name,
      render: r => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Avatar initials={r.teacher.full_name[0]} size={28} color={r.teacher.color ?? undefined} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--text-1)' }}>{r.teacher.full_name}</div>
            {r.teacher.nationality && (
              <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{r.teacher.nationality}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'subjects', title: 'Chuyên môn',
      render: r => {
        const subs = (r.teacher.teacher_subjects ?? []).map(ts => ts.subject?.name).filter(Boolean)
        return subs.length > 0 ? subs.join(', ') : '—'
      },
    },
    { key: 'phone',  title: 'SĐT', render: r => r.teacher.phone || '—' },
    { key: 'classCount', title: 'Lớp đang dạy', align: 'right',
      render: r => <strong style={{ color: 'var(--text-1)' }}>{r.classCount}</strong> },
    { key: 'studentCount', title: 'Tổng học viên', align: 'right',
      render: r => r.studentCount },
    {
      key: 'hoursPerWeek', title: 'Giờ/tuần', align: 'right',
      render: r => (
        <Badge style={{
          background: r.hoursPerWeek > avgHours * 1.3 ? '#fee2e2'
                    : r.hoursPerWeek < avgHours * 0.5 ? '#e0f2fe'
                    : '#dcfce7',
          color: r.hoursPerWeek > avgHours * 1.3 ? '#dc2626'
               : r.hoursPerWeek < avgHours * 0.5 ? '#0ea5e9'
               : '#16a34a',
        }}>{r.hoursPerWeek}h</Badge>
      ),
    },
    {
      key: 'status', title: 'Trạng thái',
      filterable: true, filterType: 'select',
      filterOptions: Object.entries(STATUS_LABEL).map(([v, l]) => ({ value: v, label: l })),
      filterValue: r => r.teacher.status,
      render: r => (
        <Badge style={{ background: STATUS_COLOR[r.teacher.status] + '20', color: STATUS_COLOR[r.teacher.status] }}>
          {STATUS_LABEL[r.teacher.status]}
        </Badge>
      ),
    },
  ]

  const handleExport = () => {
    exportCsv('bao-cao-giao-vien',
      ['Họ tên', 'Quốc tịch', 'Chuyên môn', 'SĐT', 'Email', 'Số lớp', 'Học viên', 'Giờ/tuần', 'Trạng thái'],
      stats.map(s => [
        s.teacher.full_name,
        s.teacher.nationality ?? '',
        (s.teacher.teacher_subjects ?? []).map(t => t.subject?.name).filter(Boolean).join(', '),
        s.teacher.phone ?? '',
        s.teacher.email ?? '',
        s.classCount, s.studentCount, s.hoursPerWeek,
        STATUS_LABEL[s.teacher.status] ?? s.teacher.status,
      ]),
    )
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
        <KpiStat label="Tổng giáo viên" value={allT.length}
          sub={<span>{active} đang dạy</span>}
          icon="graduation" color="#FF6B35" bg="var(--primary-light)" delay={0} />
        <KpiStat label="Lớp đang dạy" value={totalClassCount}
          sub={<span>tổng số lớp active</span>}
          icon="book" color="#2563eb" bg="#dbeafe" delay={70} />
        <KpiStat label="Giờ TB / GV" value={avgHours + 'h'}
          sub={<span>mỗi tuần</span>}
          icon="clock" color="#16a34a" bg="#dcfce7" delay={140} />
        <KpiStat label="Nghỉ phép" value={onLeave}
          sub={<span>{inactive} đã nghỉ việc</span>}
          icon="alert" color="#d97706" bg="#fef3c7" delay={210} />
      </div>

      {/* Workload bars */}
      <Card animate delay={280} style={{ padding: 18, marginBottom: 14 }}>
        <SectionHeader title="Khối lượng dạy theo giáo viên"
          subtitle={`So sánh với mức TB ${avgHours}h/tuần · Đỏ = quá tải, Xanh dương = ít giờ`}
          icon="bar-chart" iconColor="#8b5cf6" />
        {loadBars.length > 0 ? (
          <HorizontalBars rows={loadBars} labelWidth={150} height={24} />
        ) : (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-4)', fontSize: 12 }}>
            Chưa có dữ liệu phân công
          </div>
        )}
      </Card>

      {/* Table */}
      <DataGrid<TeacherStat>
        title="Chi tiết phân công giáo viên"
        subtitle={`${stats.length} giáo viên`}
        data={stats}
        columns={cols}
        rowKey={r => r.teacher.id}
        emptyText="Chưa có giáo viên"
        loading={tLoading || cLoading}
        defaultPageSize={20}
        exportFilename="phan-cong-giao-vien"
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
